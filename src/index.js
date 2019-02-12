const moment = require('moment');
const yahooFinance = require('yahoo-finance');
const Mailgun = require('mailgun-js');
const config = require('./config.json');

const emailText = (symbol, percent) => `
  Stock alarm has been triggered for ${percent}% difference in the price, in the last month.

  Do not panic. Market corrections happen quite often. It's an opportunity to buy stock at a discounted price.

  Actions:
  1. SELL 5% of my bonds and
  2. BUY ${symbol} for all the money
`;

const sendEmail = (text, callback) => {
  const mailgun = new Mailgun({
    apiKey: process.env.MAILGUN_KEY,
    domain: process.env.MAILGUN_DOMAIN,
    timeout: 3000,
  });

  mailgun.messages().send({
    from: process.env.SENDER_EMAIL,
    to: process.env.RECIPIENT_EMAIL,
    subject: '[IMPORTANT] Stock Alarm triggered',
    text,
  }, callback);
}

module.exports.run = (event, context, callback) => {
  new Promise((resolve, reject) => {
    yahooFinance.historical({
      symbols: config.map((row) => row.symbol),
      from: moment().subtract(1, 'month').format('YYYY-MM-DD'),
      to: moment().format('YYYY-MM-DD'),
    }, (err, response) => {
      if (err) {
        return reject(err);
      }

      resolve(response);
    });

  })
  .then((response) =>
    config.map((row) => {
      const quotes = response[row.symbol];
      const open = quotes[quotes.length - 1].open;
      const close = quotes[0].close;

      const difference = close / open - 1;
      const percent = (difference * 100).toFixed(2);

      return {
        symbol: row.symbol,
        percent,
        difference,
        threshold: row.threshold,
      };
    })
    .filter((row) => row.difference > -100 && row.difference <= row.threshold),
  )
  .then((symbols) => symbols.length ? new Promise((resolve, reject) => {
    let done = 0;

    symbols.forEach((row) => {
      sendEmail(emailText(row.symbol, row.percent), (err) => {
        if (err) {
          return reject(err);
        }

        done += 1;

        if (done >= symbols.length) {
          resolve(symbols);
        }
      })
    });
  }) : [])
  .then((symbols) => {
    if (symbols.length === 0) {
      callback(null, 'No symbols reached the threshold. No emails have been sent.');
      return;
    }

    callback(null, `Sucessfully sent out email notification/s for ${symbols.join(', ')} symbols.`);
  })
  .catch((err) => {
    callback(err);
  });
}

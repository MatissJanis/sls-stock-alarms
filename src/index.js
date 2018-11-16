const moment = require('moment');
const yahooFinance = require('yahoo-finance');
const Mailgun = require('mailgun-js');

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
  });

  mailgun.messages().send({
    from: process.env.SENDER_EMAIL,
    to: process.env.RECIPIENT_EMAIL,
    subject: '[IMPORTANT] Stock Alarm triggered',
    text,
  }, callback);
}

module.exports.run = (event, context, callback) => {
  const symbol = process.env.STOCK_SYMBOL;

  yahooFinance.historical({
    symbol,
    from: moment().subtract(1, 'month').format('YYYY-MM-DD'),
    to: moment().format('YYYY-MM-DD'),
  }, function (err, quotes) {
    if (err) {
      return callback(err);
    }

    const open = quotes[0].open;
    const close = quotes[quotes.length - 1].close;

    const difference = close / open - 1;
    const percent = (difference * 100).toFixed(2);

    if (difference <= process.env.ALARM_THRESHOLD) {
      return sendEmail(emailText(symbol, percent), (err) => {
        if (err) {
          return callback(err);
        }

        callback(null, `Sucessfully sent out email notification for ${percent}% difference.`);
      });
    }

    callback(null, `Email does not need to be sent for ${percent}% difference.`);
  });
}

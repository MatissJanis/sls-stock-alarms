# sls-stock-alarms

[![Build Status](https://travis-ci.org/brokalys/sls-data-extraction.svg?branch=master)](https://travis-ci.org/brokalys/sls-data-extraction)

Serverless stock email alarms when the specified thresholds are reached.

## Requirements
- Node
- NPM
- Serverless (installed globally on local machine)

## Installation
```sh
npm install
```

## Usage
1. Define necessary env variables in `serverless.env.yml` (example available in `serverless.env.example.yml`)

2. Run
```sh
sls invoke local -f stock-alarms
```

### Available functions
- stock-alarms

## Deployment
Deployment is taken care by travis. If, for some odd reason, it's required to deploy manually, it can be achieved by running the following command.

```sh
npm run deploy
```

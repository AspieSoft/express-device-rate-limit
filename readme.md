# Express Device Rate Limit

![npm version](https://img.shields.io/npm/v/express-device-rate-limit)
![dependency status](https://img.shields.io/librariesio/release/npm/express-device-rate-limit)
![gitHub top language](https://img.shields.io/github/languages/top/aspiesoft/express-device-rate-limit)
![npm license](https://img.shields.io/npm/l/express-device-rate-limit)

![npm weekly downloads](https://img.shields.io/npm/dw/express-device-rate-limit)
![npm monthly downloads](https://img.shields.io/npm/dm/express-device-rate-limit)

[![donation link](https://img.shields.io/badge/buy%20me%20a%20coffee-square-blue)](https://buymeacoffee.aspiesoft.com)

Rate limiting that can be stricter on cirtain devices or geo locations.

## Installation

```shell script
npm install express-device-rate-limit
```

## Setup

```js

const deviceRateLimit = require('express-device-rate-limit');

const express = require('express');
const app = express();

const rateLimit = deviceRateLimit({/* options */});


// auto setup
rateLimit.all(app);


// manual setup

// body parser pre config
app.use(rateLimit.bodyParserUrlEncoded());
app.use(rateLimit.bodyParserJSON());
// or access the body-parser module directly
app.use(rateLimit.bodyParser.urlencoded({extended: true}))
app.use(rateLimit.bodyParser.json({type: ['json', 'application/csp-report'], limit: '1mb'}))

// device.capture function
app.use(rateLimit.deviceCapture());
// or access the express-device module directly
app.use(rateLimit.device.capture());

app.use(rateLimit.rateLimit());

```

## Usage

```js

//node: these are the default values for these options
const rateLimit = deviceRateLimit({

  // the number of requests that can be made by a user within a given time
  // this is multiplied by the value of the defEffect option
  limit: 100,

  // the amount of time before reseting the recording of a users request rate
  // s: seconds, m: minutes, h: hours, D: days, M: months, Y: years
  time: '1m',

  // the amount of time to kick a user who goes above the rate limit
  kickTime: '1h',

  // the default score to increase a user request rate by
  defEffect: 5,

  // the minimum score to increase a user request rate by
  minEffect: 1,

  // the maximum score to increase a user request rate by
  maxEffect: this.limit * this.defEffect / 20,

  // how strict should a score increase be
  // the amount a score is increased by will be multiplied by this number
  strict: 1,

  // how passive should a score decrease be
  // the amount a score is decreased by will be multiplied by this number
  passive: 1,


  // optional: handle a rate limit error in any way you want
  err: function(req, res, next){
    // by default this status and message is sent if a users request rate goes past the limit
    res.status(429).send('<h1>Error 429</h1><h2>Too Many Requests</h2>').end();
  },


  // optional: geo location options
  // you can increase the effect (rate score) of a user based on location
  geo: {

    // how strict should a score increase be
    // the amount a score is increased by will be multiplied by this number
    //note: if this number is negative, the score will be decreased
    // a decreased score allows you to be stricter on a specific location instead
    strict: 1,

    // the below options are disabled and ignored by default
    //note: each option is added up
    // specifying a country and region will increase the score twice if neither apply

    country: ['US'], // +4
    region: ['NY'], // +3
    city: ['MyCityName'], // +2
    timezone: ['America/New_York'], // +2
    range: [12345, 67890], // +1
    area: 1, // +0.5
    metro: 123, // +0.5

    //note: if the geoIP module returns null, their score will be increased by +2
  },
});

```

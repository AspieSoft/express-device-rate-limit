const validator = require('validator');

const bodyParser = requireOptional('body-parser');
const device = requireOptional('express-device');
const geoIP = requireOptional('geoip-lite');

function requireOptional(mod){
  try {
    return require(mod);
  } catch(e) {
    return undefined;
  }
}

// const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

function clean(input, allowControlChars = false) {
  // valid ascii characters: https://ascii.cl/htmlcodes.htm
  // more info: https://en.wikipedia.org/wiki/ASCII
  let allowList = [
    338,
    339,
    352,
    353,
    376,
    402,

    8211,
    8212,
    8216,
    8217,
    8218,
    8220,
    8221,
    8222,
    8224,
    8225,
    8226,
    8230,
    8240,
    8364,
    8482,
  ];

  function cleanStr(input) {
    input = validator.stripLow(input, {keep_new_lines: true});
    if(validator.isAscii(input)) {
      return input;
    }
    let output = '';
    for(let i = 0; i < input.length; i++) {
      let charCode = input.charCodeAt(i);
      if((allowControlChars && charCode >= 0 && charCode <= 31) || (charCode >= 32 && charCode <= 127) || (charCode >= 160 && charCode <= 255) || allowList.includes(charCode)) {
        output += input.charAt(i);
      }
    }
    if(validator.isAscii(output)) {
      return output;
    }
    return undefined;
  }

  function cleanArr(input) {
    let output = [];
    input.forEach(value => {
      output.push(cleanType(value));
    });
    return output;
  }

  function cleanObj(input) {
    let output = {};
    Object.keys(input).forEach(key => {
      key = cleanType(key);
      output[key] = cleanType(input[key]);
    });
    return output;
  }

  function cleanType(input) {
    if(input === null) {
      return null;
    } else if(input === undefined) {
      return undefined;
    } else if(input === NaN) {
      return NaN;
    }

    let type = varType(input);

    switch(type) {
      case 'string':
        return cleanStr(input);
      case 'array':
        return cleanArr(input);
      case 'object':
        return cleanObj(input);
      case 'number':
        return Number(input);
      case 'boolean':
        return !!input;
      case 'regex':
        let flags = '';
        let re = input.toString().replace(/^\/(.*)\/(\w*)$/, function(str, r, f) {
          flags = cleanStr(f) || '';
          return cleanStr(r) || '';
        });
        if(!re || re === '') {return undefined;}
        return RegExp(re, flags);
      case 'symbol':
        input = cleanStr(input.toString());
        if(input !== undefined) {
          return Symbol(input);
        }
        return undefined;
      case 'bigint':
        return BigInt(input.toString().replace(/[^0-9\.\-\+enf_]/g, ''));
      default:
        return undefined;
    }
  }

  return cleanType(input);
}

function varType(value) {
  if(Array.isArray(value)) {
    return 'array';
  } else if(value === null) {
    return 'null';
  } else if(value instanceof RegExp) {
    return 'regex';
  }
  return typeof value;
}

function toTimeMillis(str){
  if(typeof str === 'number'){return Number(str);}
  if(!str || typeof str !== 'string' || str.trim() === ''){return NaN;}
  if(str.endsWith('h')){
    return toNumber(str)*3600000;
  }else if(str.endsWith('m')){
    return toNumber(str)*60000;
  }else if(str.endsWith('s')){
    return toNumber(str)*1000;
  }else if(str.endsWith('D')){
    return toNumber(str)*86400000;
  }else if(str.endsWith('M')){
    return toNumber(str)*2628000000;
  }else if(str.endsWith('Y')){
    return toNumber(str)*31536000000;
  }else if(str.endsWith('DE')){
    return toNumber(str)*315360000000;
  }else if(str.endsWith('C') || this.endsWith('CE')){
    return toNumber(str)*3153600000000;
  }else if(str.endsWith('ms')){
    return toNumber(str);
  }else if(str.endsWith('us') || this.endsWith('mic')){
    return toNumber(str)*0.001;
  }else if(str.endsWith('ns')){
    return toNumber(str)*0.000001;
  }
  return toNumber(str);
}

function toNumber(str){
  if(typeof str === 'number'){return str;}
  return Number(str.replace(/[^0-9.]/g, '').split('.', 2).join('.'));
}

function loadedMiddleware(app, search){
  let stack = [];
  if(app.stack){
    stack = stack.concat(app.stack)
  }
  if(app._router && app._router.stack){
    stack = stack.concat(app._router.stack)
  }

  const using = [];
  for(let i = 0; i < stack.length; i++){
    let ind = search.indexOf(stack[i].name);
    if(ind !== -1){
      using.push(search.splice(ind, 1)[0]);
    }
  }

  return using;
}

function main({limit, time, kickTime, defEffect, minEffect, maxEffect, strict, passive, geo, err} = {}){

  limit = Number(limit);
  if(!['string', 'number'].includes(typeof time)){time = undefined;}
  if(!['string', 'number'].includes(typeof kickTime)){kickTime = undefined;}
  defEffect = Number(defEffect);
  minEffect = Number(minEffect);
  maxEffect = Number(maxEffect);
  strict = Number(strict);
  passive = Number(passive);

  if(!limit || limit < 1){limit = 100;}
  if(!time){time = '1m';}
  if(!kickTime){kickTime = '1h';}
  if(!defEffect || defEffect < 1){defEffect = 5;}
  if(!minEffect || minEffect < 1){minEffect = 1;}
  if(!maxEffect || maxEffect < 1){maxEffect = limit/20;}
  if(!strict || strict < 1){strict = 1;}
  if(!passive || passive < 1){passive = 1;}

  if(typeof err !== 'function'){err = undefined;}
  if(typeof geo !== 'object'){geo = undefined;}

  limit *= defEffect;

  geoStrict = 1;
  if(geo && geo.strict){
    geoStrict = Number(geo.strict) || 1;
  }


  const CallListIP = {};
  const LimitTime = {};

  setInterval(() => {
    let keys = Object.keys(CallListIP);
    for(let i = 0; i < keys.length; i++){
      delete CallListIP[keys[i]];
    }

    keys = Object.keys(LimitTime);
    for(let i = 0; i < keys.length; i++){
      if(new Date().getTime() > LimitTime[keys[i]]){
        delete LimitTime[keys[i]];
      }
    }
  }, toTimeMillis(time));

  function rateLimit(req, res, next){
    const ip = clean(req.ip);

    if(ip === 'localhost' || ip === '127.0.0.1' || ip === '::1'){
      next();
      return;
    }

    let effect = defEffect;

    let uOS = 'other';
    let uAgent = req.header('User-Agent');
    if(uAgent.match(/\blinux\b/i)){
      uOS = 'linux';
      effect += 2 * strict;
    }else if(uAgent.match(/\bwindows\b/i)){
      uOS = 'windows';
    }else if(uAgent.match(/\b(apple|mac)\b/i)){
      uOS = 'apple';
    }else if(uAgent.match(/\bchrom(e|ium)\s*os\b/i)){
      uOS = 'chrome';
      effect -= 1 * passive;
    }else if(uAgent.match(/\bandroid\b/i)){
      uOS = 'android';
      effect -= 2 * passive;
    }else if(uAgent.match(/\bios\b/i)){
      uOS = 'ios';
      effect -= 2 * passive;
    }

    if(device && req.device){
      let type = req.device.type;
      if(uOS !== 'other' && type === 'bot'){
        effect *= 1.2;
      }else if(type === 'phone'){
        effect -= 1 * passive;
      }else if(type === 'tv'){
        effect -= 2 * passive;
      }else if(type === 'car'){
        effect -= 3 * passive;
      }
    }

    if(effect < 1){
      effect = 1;
    }

    if(geo && geoIP){
      const loc = geoIP.lookup(ip);
      if(!loc){
        effect += 2 * geoStrict;
      }else{
        if(geo.country && !geo.country.includes(loc.country)){
          effect += 4 * geoStrict;
        }
        if(geo.region && !geo.region.includes(loc.region)){
          effect += 3 * geoStrict;
        }
        if(geo.city && !geo.city.includes(loc.city)){
          effect += 2 * geoStrict;
        }
        if(geo.timezone && !geo.timezone.includes(loc.timezone)){
          effect += 2 * geoStrict;
        }
        if(geo.range && (loc.range[1] < geo.range[0] || loc.range[0] > geo.range[1])){
          effect += 1 * geoStrict;
        }
        if(geo.area && !geo.area.includes(loc.area)){
          effect += 0.5 * geoStrict;
        }
        if(geo.metro && !geo.metro.includes(loc.metro)){
          effect += 0.5 * geoStrict;
        }
      }
    }

    if(effect < minEffect){
      effect = minEffect;
    }else if(effect > maxEffect){
      effect = maxEffect;
    }

    let uID = undefined;
    if(ip.includes('::')){
      // ipv6
      uID = ip.replace(/^(.*?::.*?)::.*$/, '$1');
      uID += ':' + uOS;
      if(device && req.device){
        uID += ':' + req.device.type + ':' + req.device.name;
      }
    }else if(ip.match(/^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/)){
      // ipv4
      uID = ip.replace(/^([0-9]+\.[0-9]+\.[0-9]+)\.[0-9]+$/, '$1');
      uID += ':' + uOS;
      if(device && req.device){
        uID += ':' + req.device.type;
      }
      effect += 1;
    }else{
      uID = ip;
      effect += 2;
    }

    try {
      if(!CallListIP[uID]){
        CallListIP[uID] = 0;
      }
      CallListIP[uID] += effect;
    } catch(e) {}

    if(new Date().getTime() > LimitTime[uID]){
      if(typeof err === 'function'){
        err(req, res);
      }else if(typeof err === 'object'){
        let status = Number(err.status) || 429;
        let msg = Number(err.msg) || 'Too Many Requests';
        res.status(status).send('<h1>Error ' + status + '</h1><h2>' + msg + '</h2>').end();
      }else{
        res.status(429).send('<h1>Error 429</h1><h2>Too Many Requests</h2>').end();
      }
      return;
    }

    if(CallListIP[uID] > limit){
      LimitTime[uID] = (new Date().getTime()) + toTimeMillis(kickTime);
      if(typeof err === 'function'){
        err(req, res, next);
      }else if(typeof err === 'object'){
        let status = Number(err.status) || 429;
        let msg = Number(err.msg) || 'Too Many Requests';
        res.status(status).send('<h1>Error ' + status + '</h1><h2>' + msg + '</h2>').end();
      }else{
        res.status(429).send('<h1>Error 429</h1><h2>Too Many Requests</h2>').end();
      }
      return;
    }

    next();
  };

  return {
    bodyParser,
    bodyParserUrlEncoded: bodyParser.urlencoded.bind(this, {extended: true}),
    bodyParserJSON: bodyParser.json.bind(this, {type: ['json', 'application/csp-report'], limit: '1mb'}),
    device,
    deviceCapture: device.capture,
    rateLimit: function(){return rateLimit;},
    all: function(app){
      const using = loadedMiddleware(app, ['urlencodedParser', 'jsonParser']);
      if(!using.includes('urlencodedParser')){
        app.use(bodyParser.urlencoded({extended: true}));
      }
      if(!using.includes('jsonParser')){
        app.use(bodyParser.json({type: ['json', 'application/csp-report'], limit: '1mb'}));
      }

      app.use(device.capture());

      app.use(rateLimit);

      return function(){};
    }
  };
}

module.exports = main;

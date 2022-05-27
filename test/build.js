const miniforge = require('miniforge-js');
const fs = require('fs');

miniforge.rootDir(__dirname);

miniforge.build('./index.js', {outputNameMin: true});

let testFile = fs.readFileSync('./test/index.js').toString();
testFile = testFile.replace(/require\((['"`])\.\.\/index\1\)/g, 'require($1../index.min$1)');
fs.writeFileSync('./test/index.min.js', testFile);

console.log('Finished Build');

require('./index.min');

setTimeout(function(){process.exit(0);}, 5000);

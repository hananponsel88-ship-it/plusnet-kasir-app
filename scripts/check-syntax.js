const babel = require('@babel/core');
const presetExpo = require('babel-preset-expo');
const fs = require('fs');

const file = process.argv[2];
if (!file) {
  console.error('usage: node check-syntax.js <path-to-js>');
  process.exit(2);
}
const src = fs.readFileSync(file, 'utf8');
try {
  babel.transformSync(src, {
    filename: file,
    babelrc: false,
    configFile: false,
    presets: [presetExpo],
  });
  console.log('SYNTAX_OK ' + file + ' (' + src.split(/\r?\n/).length + ' lines)');
} catch (e) {
  console.error('SYNTAX_FAIL ' + file);
  console.error(e.message);
  process.exit(1);
}

'use strict';

const fs = require('fs');

const Compiler = require(__dirname + '/bin/compiler.js');

const config = require(__dirname + '/bin/lexis_tokens.json');
const library = require(__dirname + '/bin/standart-library.js');

const infloComliper = new Compiler(config, library);

const sourcePath = process.argv[2];
const source = fs.readFileSync('./' + sourcePath).toString();

infloComliper.compile(source);

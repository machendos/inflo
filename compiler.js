'use strict';

const fs = require('fs');

const Lexer = require(__dirname + '/lexer-productor.js');
const Syntaxer = require(__dirname + '/syntaxer.js');
const Analyzer = require(__dirname + '/semantic-analyser.js');
const Translator = require(__dirname + '/translator.js');

const library = require(__dirname + '/standart-library.js');
const config = require(__dirname + '/lexis_tokens.json');

const sourcePath = process.argv[2];
const source = fs.readFileSync('./' + sourcePath).toString();

const lexer = new Lexer(config)
  .build()
  .apply(source);

const ast = new Syntaxer(lexer)
  .build();

// console.dir(ast.root, {depth: null, showHidden: true});

const analyser = new Analyzer(library, ast);

new Translator(library)
  .apply(analyser.analyse())
  .translate();

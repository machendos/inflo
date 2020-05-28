'use strict';

const Lexer = require(__dirname + '/lexer-productor.js');
const Syntaxer = require(__dirname + '/syntaxer.js');
const Analyzer = require(__dirname + '/semantic-analyser.js');
const Translator = require(__dirname + '/translator.js');

class Compiler {

  constructor(config, library) {
    this.config = config;
    this.library = library;
  }

  compile(source) {

    const lexer = new Lexer(this.config)
      .build()
      .apply(source);

    const ast = new Syntaxer(lexer)
      .build();

    const analyser = new Analyzer(this.library, ast);

    return new Translator(this.library)
      .apply(analyser.analyse())
      .translate();

  }

}

module.exports = Compiler;

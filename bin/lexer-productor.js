/* eslint-disable no-unused-vars */
'use strict';

class Lexer {

  constructor(config) {
    this.config = config;
    this.fullTockens = [];
    this.regulars = [];
  }

  build() {

    this.tockens = Object.entries(this.config.tockens)
      .sort(([class1, token1], [class2, token2]) =>
        (typeof token2 === 'string' ? -1 : 1)
      );
    return this;
  }

  apply(source) {
    this.source = source;
    this.lines = source.split('\n');
    if (this.source[0]) {
      this.currColumn = 0;
      this.currLine = 0;
    }
    return this;
  }

  skipSpaces() {
    if (this.source[0] === ' ') {
      this.currColumn++;
      this.source = this.source.slice(1);
      this.skipSpaces();
    } else if (this.source[0] === '\n') {
      this.currLine++;
      this.currColumn = 0;
      this.source = this.source.slice(1);
      this.skipSpaces();
    }
  }

  [Symbol.iterator]() {

    const lexer = this;

    return {

      next() {

        lexer.skipSpaces();

        for (const [className, toketSpecification] of lexer.tockens) {

          const mathed = lexer.source
            .match(new RegExp('^' + toketSpecification));
          if (mathed && mathed[0]) {

            const result = {
              done: false,
              value: {
                className,
                value: mathed[0],
                column: lexer.currColumn,
                line: lexer.currLine
              }
            };

            lexer.currColumn += mathed[0].length;
            lexer.source = lexer.source.slice(mathed[0].length);
            return result;
          }
        }

        if (lexer.source.length === 0) return {
          done: true
        };

        // TODO: move throw error to separate module


        console.log(__dirname);
        console.log('Line: ' + (lexer.currLine + 1) + '\n');
        console.log(lexer.lines[lexer.currLine]);
        console.log(' '.repeat(lexer.currColumn) + '^');
        console.log(
          '\x1b[31m\x1b[1m LexicalError:\x1b[0m Unexpected symbol: ' +
          lexer.source[0] +
          '\n\n'
        );

        lexer.currColumn++;
        lexer.source = lexer.source.slice(1);
        return {
          value: { error: true },
          done: lexer.config.configs.on_error !== 'continue'
        };

      }
    };
  }

}

module.exports = Lexer;

'use strict';

class Lexer {

  constructor(config) {
    this.config = config;
    this.fullTockens = [];
    this.regulars = [];
    this.build();
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
            lexer.currColumn += mathed[0].length;
            lexer.source = lexer.source.slice(mathed[0].length);
            return {
              done: false,
              value: {
                class: className,
                value: mathed[0],
              }
            };
          }
        }

        if (lexer.source.length === 0) return {
          done: true
        };

        lexer.source = lexer.source.slice(1);
        return {
          value: 'TERMINAl'
        };

      }
    };
  }

}

module.exports = Lexer;

'use strict';

class Lexer {

  constructor(config) {
    this.config = config;
    this.fullTockens = [];
    this.regulars = [];
    this.build();
  }

  build() {
    Object.entries(this.config.tockens)
      .forEach(([className, toketSpecification]) => {
        if (typeof toketSpecification === 'string') {
          this.regulars.push([className, toketSpecification]);
        } else {
          this.fullTockens
            .push(...toketSpecification.map(token => [className, token]));
        }
      });
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

        console.log(lexer.currColumn);

        for (const [className, token] of lexer.fullTockens) {

          const mathed = lexer.source.match(new RegExp('^' + token));
          if (mathed && mathed[0]) {
            lexer.currColumn += token.length;
            lexer.source = lexer.source.slice(token.length);
            return {
              done: false,
              value: {
                class: className,
                value: token,
              }
            };
          }

        }

        for (const [className, toketSpecification] of lexer.regulars) {

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

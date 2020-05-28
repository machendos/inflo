'use strict';

const fs = require('fs');

const Lexer = require(__dirname + '/lexer-productor.js');
const Syntaxer = require(__dirname + '/syntaxer.js');
const Translator = require(__dirname + '/translator.js');
const config = require(__dirname + '/lexis_tokens.json');
const library = require(__dirname + '/standart-library.js');

class ValueContainer {
  constructor() {
    this.container = [];
  }

  add(value, level) {
    this.container.push({ value, level });
  }

  check(checkedValue) {
    return this.container.findIndex(({ value }) => value === checkedValue) > -1;
  }

  checkOnCurrLevel(checkedValue, checkedLevel) {
    return this.container.findIndex(({ value, level }) =>
      value === checkedValue && level === checkedLevel
    ) > -1;
  }

  filterForLevelMoreThen(levelF) {
    this.container =
      this.container.filter(({ level }) => level <= levelF);
  }

}

class Analyser {
  constructor(standartLibrary, ast) {
    this.ast = ast;
    this.values = new ValueContainer();
    this.values.container =
      Object.entries(standartLibrary).map(([name]) => ({ level: 0, value: name }));
    this.ast.imports = [];
  }

  import() {
    const rootChildren = this.ast.root.children;
    const importPaths = rootChildren
      .filter(({ type }) => type === 'import')
      .map(node => node.value.slice(1, -1));
    importPaths.forEach(path => {
      const subModule = fs.readFileSync(path).toString();

      const ast = new Syntaxer(new Lexer(config).build().apply(subModule))
        .build();

      const importedVariables = Object.entries(new Translator(library)
        .apply(new Analyser(library, ast).analyse())
        .translate());

      importedVariables.forEach(([key, value]) => {
        this.values.add(key, 0)
        this.ast.imports[key] = value;
      });
      this.ast.imports = importedVariables;
    });
    return this;
  }

  analyse() {
    this.import();
    this.analyseOrder(this.ast.root, 1);
    return this.ast;
  }

  analyseOrder(node, level) {

    this.finiteCheck(node.type, node.value, node.children, level, node);

    for (const child of node.children) {

      const { type, value, children } = child;

      this.finiteCheck(type, value, children, level, child);

      children.forEach(node => {
        this.analyseOrder(node, level + 1);
      });

    }

    this.values.filterForLevelMoreThen(level);

  }

  finiteCheck(type, value, children, level, node) {

    if (type === 'declaration') {
      const alreadyExist = this.values.checkOnCurrLevel(value, level);
      if (alreadyExist) {

        console.log(__dirname);
        console.log(
          '\n\x1b[31m\x1b[1m SemanticError:\x1b[0m ' + value + ' already exist\n\n'
        );
        process.exit();
      } else {

        node.parameters.forEach(value => this.values.add(value, level + 1));
        this.values.add(value, level);
      }
    }

    if (type === 'call' && value === 'define') {
      const name = children[0].value;
      const alreadyExist = this.values.checkOnCurrLevel(name, level);
      if (alreadyExist) {

        console.log(__dirname);
        console.log(
          '\n\x1b[31m\x1b[1m SemanticError:\x1b[0m ' + name + ' already exist\n\n'
        );
        process.exit();
      } else {
        this.values.add(name, level);
      }
    }

    if (type === 'call' || type === 'list') {
      children.forEach(({ type, value }) => {
        if (type === 'value') {
          const exist = this.values.check(value);
          if (!exist) {

            console.log(__dirname);
            console.log(
              '\n\x1b[31m\x1b[1m SemanticError:\x1b[0m ' + value + ' is not already exist\n\n'
            );
            process.exit();
          }
        }
      });
    }

    if (type === 'call') {
      const exist = this.values.check(value);
      if (!exist) {

        console.log(__dirname);
        console.log(
          '\n\x1b[31m\x1b[1m SemanticError:\x1b[0m ' + value + ' is not already exist\n\n'
        );
        process.exit();
      }
    }

  }

}

module.exports = Analyser;

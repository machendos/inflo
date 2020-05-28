'use strict';

class Translator {
  constructor(library) {
    this.standart = library;
  }

  apply(ast) {
    this.ast = ast;
    this.functions = Object.assign({}, this.standart);
    this.arguments = {};
    this.temp = {};

    this.ast.imports.forEach(([key, value]) => this.arguments[key] = value);

    return this;
  }

  translate() {

    this.ast.root.children.forEach(child => {

      const { type, value } = child;

      if (type === 'declaration') {
        this.functions[value] = child;
      } else if (type === 'call') {
        return this.call(child);
      }
    });
    return this.arguments;
  }

  call(node) {
    const children = node.children;
    const value = node.value;

    if (value === 'define') {
      const name = children[0].value;
      let value;
      const valueNode = children[1];

      if (valueNode.type === 'list') {
        value = this.createList(valueNode);
      } else if (valueNode.type === 'call') {
        value = this.call(valueNode);
      } else if (valueNode.type === 'value') {
        const fromTemp = this.temp[valueNode.value];
        const fromGlobal = this.arguments[valueNode.value];
        value = fromTemp ? fromTemp : fromGlobal;
      } else value = valueNode.value;

      this.arguments[name] = value;
      return value;

    }


    const argumentsF = children.map((child) => {
      if (child.type === 'list') return this.createList(child);
      if (child.type === 'call') return this.call(child);
      if (child.type === 'value') {
        const fromTemp = this.temp[child.value];
        const fromGlobal = this.arguments[child.value];
        return fromTemp ? fromTemp : fromGlobal;
      }
      return child.value;
    });


    if (this.functions[value].type === 'declaration') {

      const functionDeclaration = this.functions[value];

      const parameters = functionDeclaration.parameters;

      argumentsF.forEach((value, index) => {
        this.temp[parameters[index]] = value;
      });

      const result = this.call(this.functions[value].children[0]);
      this.temp = {};
      return result;

    }
    return this.functions[value](...argumentsF);
  }

  createList(node) {
    const elements = node.children.map(child => {
      if (child.type === 'list') return this.createList(child);
      if (child.type === 'call') return this.call(child);
      if (child.type === 'value') {
        const fromTemp = this.temp[child.value];
        const fromGlobal = this.arguments[child.value];
        return fromTemp ? fromTemp : fromGlobal;
      }
      return child.value;
    });
    return elements;
  }

}

module.exports = Translator;

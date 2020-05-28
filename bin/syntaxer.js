'use strict';

const states = {
  'DONE': -1,
  'WAIT_STATEMENTS': 0,
  'WAIT_IMPORT_STRING': 1,
  'WAIT_SPECIFICATOR': 2,
  'WAIT_DECLARE_PARAMETERS_OPEN': 3,
  'WAIT_DECLARE_NAME': 4,
  'WAIT_DELIM': 5,
  'WAIT_OPEN_BODY': 6,
  'WAIT_CLOSE': 7,
  'WAIT_CALL_NAME': 8,
  'COLLECT_ARGUMENTS': 9,
  'COLLECT_ARGUMENTS_LIST': 10
};

const FSM = new Map([
  [states.DONE, []],
  [states.WAIT_STATEMENTS, ['IMPORT', 'OPEN_STATEMENT']],
  [states.WAIT_IMPORT_STRING, ['STRING']],
  [states.WAIT_SPECIFICATOR, ['DECLARATION', 'IDENTIFIER']],
  [states.WAIT_DECLARE_PARAMETERS_OPEN, ['OPEN_STATEMENT']],
  [states.WAIT_DECLARE_NAME, ['IDENTIFIER']],
  [states.WAIT_DELIM, ['IDENTIFIER', 'CLOSE_STATEMENT']],
  [states.WAIT_OPEN_BODY, ['OPEN_STATEMENT']],
  [states.WAIT_CLOSE, ['CLOSE_STATEMENT']],
  [states.WAIT_CALL_NAME, ['IDENTIFIER']],
  [states.COLLECT_ARGUMENTS, [
    'STRING', 'NUMBER', 'IDENTIFIER', 'OPEN_STATEMENT',
    'LIST_START', 'CLOSE_STATEMENT'
  ]],
  [states.COLLECT_ARGUMENTS_LIST, [
    'STRING', 'NUMBER', 'IDENTIFIER', 'OPEN_STATEMENT', 'LIST_START', 'LIST_END'
  ]]
]);

class Node {
  constructor(type, parent, value, state) {
    this.type = type;
    this.children = [];
    this.parent = parent;
    this.value = value;
    this.state = state;
  }

  addChild(type, value, state = states.DONE) {
    const newNode = new Node(type, this, value, state);
    this.children.push(newNode);
    return newNode;
  }
}

class AST {
  constructor(tokenIterator) {
    this.tokenIterator = tokenIterator;
    this.root = new Node('root', null, null, states.WAIT_STATEMENTS);
    this.currNode = this.root;
  }

  add(type, state = states.DONE, value) {
    return this.currNode.addChild(type, value, state);
  }

  check(className) {
    return FSM.get(this.currNode.state).includes(className);
  }

  build() {
    for (let { className, value, error, column, line } of this.tokenIterator) {

      if (className === 'COMMENTS') continue;

      if (error) continue;
      if (!this.check(className))  {
        console.log(__dirname);
        console.log('Line: ' + (line + 1) + '\n');
        console.log(this.tokenIterator.lines[this.tokenIterator.currLine]);
        console.log(' '.repeat(column) + '^');
        console.log(
          `\x1b[31m\x1b[1m SyntaxError:\x1b[0m Unexpected token: ${value}\nExpect: ${FSM.get(this.currNode.state)}\n`
        );
        // process.exit();
      }

      if (value === 'T') {
        className = 'BOOLEAN';
        value = true;
      } else if (value === 'F') {
        className = 'BOOLEAN';
        value = false;
      } else if (className === 'number') {
        value = parseFloat(value);
      }

      if (className === 'IMPORT') {

        this.currNode = this.add('import', states.WAIT_IMPORT_STRING);

      } else if (className === 'STRING') {

        if (this.currNode.state === states.WAIT_IMPORT_STRING) {
          this.currNode.value = value;
          this.currNode = this.currNode.parent;
        } else {
          this.add('string', undefined, value);
        }

      } else if (className === 'OPEN_STATEMENT') {

        if (this.currNode.state === states.WAIT_STATEMENTS) {
          this.currNode = this.add(null, states.WAIT_SPECIFICATOR, null);

        } else if (
          this.currNode.state === states.WAIT_DECLARE_PARAMETERS_OPEN
        ) {
          this.currNode.state = states.WAIT_DECLARE_NAME;
        } else if (this.currNode.state === states.WAIT_OPEN_BODY) {
          this.currNode.state = states.WAIT_CLOSE;
          this.currNode = this.add('call', states.WAIT_CALL_NAME);
        } else if (
          this.currNode.state === states.COLLECT_ARGUMENTS ||
          this.currNode.state === states.COLLECT_ARGUMENTS_LIST
        ) {
          this.currNode = this.add('call', states.WAIT_CALL_NAME);
        }

      } else if (className === 'DECLARATION') {

        this.currNode.type = 'declaration';
        this.currNode.parameters = [];
        this.currNode.state = states.WAIT_DECLARE_PARAMETERS_OPEN;

      } else if (className === 'IDENTIFIER') {

        if (this.currNode.state === states.WAIT_DECLARE_NAME) {
          this.currNode.value = value;
          this.currNode.state = states.WAIT_DELIM;
        } else if (this.currNode.state === states.WAIT_DELIM) {
          this.currNode.parameters.push(value);
        } else if (this.currNode.state === states.WAIT_CALL_NAME) {
          this.currNode.value = value;
          this.currNode.state = states.COLLECT_ARGUMENTS;
        } else if (
          this.currNode.state === states.COLLECT_ARGUMENTS ||
          this.currNode.state === states.COLLECT_ARGUMENTS_LIST
        ) {
          this.add('value', undefined, value);
        } else if (this.currNode.state === states.WAIT_SPECIFICATOR) {
          this.currNode.type = 'call';
          this.currNode.state = states.COLLECT_ARGUMENTS;
          this.currNode.value = value;
        }
      } else if (className === 'CLOSE_STATEMENT') {

        if (this.currNode.state === states.WAIT_DELIM) {
          this.currNode.state = states.WAIT_OPEN_BODY;
        } else if (
          this.currNode.state === states.COLLECT_ARGUMENTS ||
          this.currNode.state === states.WAIT_CLOSE
        ) {
          this.currNode = this.currNode.parent;
        }

      } else if (className === 'NUMBER') {
        this.add('number', undefined, value);
      } else if (className === 'BOOLEAN') {
        this.add('boolean', undefined, value);
      } else if (className === 'LIST_START') {
        this.currNode = this.add('list', states.COLLECT_ARGUMENTS_LIST);
      } else if (className === 'LIST_END') {
        this.currNode = this.currNode.parent;
      }

    }

    if (this.currNode.type !== 'root')  {
      console.log(__dirname);
      console.log('Line: ' + (this.tokenIterator.currLine) + '\n');
      console.log(
        '\x1b[31m\x1b[1m SyntaxError:\x1b[0m Unexpected end of file\n'
      );
      process.exit();
    }

    return this;
  }

}

module.exports = AST;

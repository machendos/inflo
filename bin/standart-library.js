'use strict';

const library = {

  output: (...text) => console.log(...text),

  if: (condition, thenPart, elsePart) => (condition ? thenPart : elsePart),

  random: () => Math.random(),

  define: (argument, value) => value,

  car: list => list[0],

  cdr: list => list.slice(1),

  less: (par1, par2) => par1 < par2,

  M: list => list.reduce((prev, curr) => prev + curr) / list.length,

  plus: (...values) => values.reduce((prev, curr) => prev + curr),
  minus: (val1, val2) => val1 - val2

};

module.exports = library;

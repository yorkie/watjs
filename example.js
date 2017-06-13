'use strict';

const wat = require('./wat');

// create module
const mod = wat.module();

// import console.log from JavaScript
mod.import('console.log', '$log', {
  '0': wat.i32.as('param')
});

// create $add function
const $add = wat.func('$add', {
  '0': wat.i32.as('param'),
  '1': wat.i32.as('param'),
  'lhs': wat.i32.as('local'),
  'result': wat.i32,
}, function(locals) {
  this.get(0);
  this.get(1);
  this.f32.const(5);
  this.i32.add();
});

// export this created function
mod.export('add', $add);

// print out to .wat file
console.info(mod+'');

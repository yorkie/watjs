# watjs

Write WebAssembly Text Format Files(.wat) in JavaScript way.

### Installation

```sh
$ npm install watjs --save
```

### Get Startted

```js
// load the module
const wat = require('./wat');

// create the module
const mod = wat.module();

// create the function $add.
const $add = wat.func('$add', {
  '0': wat.i32.as('param'),
  '1': wat.i32.as('param'),
  'lhs': wat.i32.as('local'),
  'result': wat.i32,
}, function() {
  this.get(0);
  this.get(1);
  this.f32.const(5);
  this.i32.add();
});

// export the $add as add in our module created.
mod.export('add', $add);

// output the generated .wat code
console.info(mod+'');
```

### API

This library provide the following APIs to write your WAT programs.

#### `wat.module()`

Represents module creation, and every returned object is an instance of `WATModule` 
internally. This class provide the following methods:

**`import(from, name, locals)`** is to import some functions from JavaScript. The
following example shows how to import `console.log` to WebAssembly runtime.

```js
var importObject = {
  console: {
    log: function(arg) {
      console.log(arg);
    }
  }
};
fetchAndInstantiate('logger.wasm', importObject).then(function(instance) {
  instance.exports.logIt();
});
```

Then let's write the code in WebAssembly:

```js
const mod = wat.module();
mod.import('console.log', '$log', {
  0: wat.i32.as('param')
});

const $logIt = wat.func('$logIt', {}, function() {
  this.i32.const(13);
  this.call('$log');
});
mod.export('logIt', logIt);
```

Then compile the above source code to `logger.wasm`, and run.

**`export(name, func)`** is to export `WATFunction` object in WebAssembly runtime.

- name `String` the name that you call at JavaScript side.
- func `WATFunction` your created `WATFunction` object which contains signature, locals and body contents.

#### `wat.func(name, locals, body)`

- name `String` the function signature name.
- locals `Object` the locals object, will describe later more details.
- body `Function` the function to write your real instructions.

**Structure your `locals`**, the `locals` object is an object, which element's key represents the name of
local, and the value should be an `WATNumber` object which could:

```js
wat.i32
wat.i32.as('param') // (param i32)
wat.i32.as('local') // (local i32)
```

**Write `body` function** provides the following internal functions for inserting instructions:

- [ ] Memory/Page resizing
  - [ ] `growMemory()` maps to `grow_memory`.
  - [ ] `getCurrentMemory()` maps to `current_memory`.
- [ ] Local variables
  - [x] `get(index)` maps to `get_local`.
  - [x] `set(index)` maps to `set_local`.
  - [ ] `tee(index)` maps to `tee_local`.
- [ ] Global varables
  - [ ] `gget(index)` maps to `get_global`.
  - [ ] `gset(index)` maps to `set_global`.
- [ ] Control flow
  - [ ] `nop()` no operation, no effect.
  - [ ] `block()` the beginning of a block construct, a sequence of instructions with a label at the end.
  - [ ] `loop()` a block with a label at the beginning which may be used to form loops.
  - [ ] `if()` the beginning of an if construct with an implicit then block.
  - [ ] `else()` marks the else block of an if.
  - [ ] `br()` branch to a given label in an enclosing construct.
  - [ ] `br_if()` conditionally branch to a given label in an enclosing construct.
  - [ ] `br_table()` a jump table which jumps to a label in an enclosing construct.
  - [ ] `return()` return zero or more values from this function.
  - [ ] `end()` an instruction that marks the end of a block, loop, if, or function.
- [ ] Calls
  - [x] `call()` maps to `call`.
  - [ ] `call_indirect()` maps to `call_indirect`.

And `i32/i64/f32/f64` iteratly maps the following operators:

- [x] `const(val)`
- [x] `load(bits, flag)`
- [x] `store(bits)`

`i32/i64` types provides the following operators:

- [x] `add()` sign-agnostic addition
- [ ] `sub()` sign-agnostic subtraction
- [ ] `mul()` sign-agnostic multiplication (lower 32-bits)
- [ ] `div()` division (result is truncated toward zero)
- [ ] `rem()` remainder (result has the sign of the dividend)
- [ ] `and()` sign-agnostic bitwise and
- [ ] `or()`  sign-agnostic bitwise inclusive or
- [ ] `xor()` sign-agnostic bitwise exclusive or
- [ ] `shl()` sign-agnostic shift left
- [ ] `shr()` zero-replicating (logical|arithmetic) shift right
- [ ] `rotl()` sign-agnostic rotate left
- [ ] `rotr()` sign-agnostic rotate right
- [ ] `eq()` sign-agnostic compare equal
- [ ] `ne()` sign-agnostic compare unequal
- [ ] `lt()` less than
- [ ] `le()` less than or equal
- [ ] `gt()` greater than
- [ ] `ge()` greater than or equal
- [ ] `clz()` sign-agnostic count leading zero bits (All zero bits are considered leading if the value is zero)
- [ ] `ctz()` sign-agnostic count trailing zero bits (All zero bits are considered trailing if the value is zero)
- [ ] `popcnt()` sign-agnostic count number of one bits
- [ ] `eqz()` compare equal to zero (return 1 if operand is zero, 0 otherwise)

Floating point `f32/f64 operators:

- [x] `add()` addition
- [ ] `sub()` subtraction
- [ ] `mul()` multiplication
- [ ] `div()` division
- [ ] `abs()` absolute value
- [ ] `neg()` negation
- [ ] `copysign()` copysign
- [ ] `ceil()` ceiling operator
- [ ] `floor()` floor operator
- [ ] `trunc()` round to nearest integer towards zero
- [ ] `nearest()` round to nearest integer, ties to even
- [ ] `eq()` compare ordered and equal
- [ ] `ne()` compare unordered or unequal
- [ ] `lt()` compare ordered and less than
- [ ] `le()` compare ordered and less than or equal
- [ ] `gt()` compare ordered and greater than
- [ ] `ge()` compare ordered and greater than or equal
- [ ] `sqrt()` square root
- [ ] `min()` minimum (binary operator); if either operand is NaN, returns NaN
- [ ] `max()` maximum (binary operator); if either operand is NaN, returns NaN

### License

No license here.

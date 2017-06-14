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

- `get()` maps to the instruction `get_local`.
- `set()` maps to the instruction `set_local`.
- `call()` maps to the instruction `call`.

And `i32/i64/f32/f64` iteratly maps the following operators:

- [x] `add()`
- [x] `const(val)`
- [x] `load(bits, flag)`
- [x] `store(bits)`

### License

No license here.

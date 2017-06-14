'use strict';

const sexp = require('node-sexp');
const wat = module.exports = {};

/**
 * @class WATNumber
 */
class WATNumber {
  /**
   * @method constructor
   * @param {String} type - i32/i64/f32/f64
   * @param {Function} onresult - for async get result
   */
  constructor(type, onresult) {
    this.type = type;
    this._for = 'param';
    this._name = undefined;
    this._onresult = onresult;
  }
  /**
   * @method load
   * @param {Number} bits - the number of bits to load
   * @param {String} flag - the s or u
   */
  load(bits, flag) {
    let data;
    if (arguments.length === 0) {
      data = `${this.type}.load`;
    } else if (arguments.length !== 2) {
      throw new TypeError('bits and flag are required.');
    } else {
      if (bits % 8 !== 0 || bits <= 0) {
        throw new TypeError('the bits could only be 8x');
      }
      if (flag !== 's' || flag !== 'u') {
        throw new TypeError('the flag could only be "s"(signed) or "u"(unsigned)');
      }
      if (this.type === 'i32' && bits > 16) {
        throw new RangeError('i32 could not handle more than 16 bits');
      }
      if (this.type === 'i64' && bits > 32) {
        throw new RangeError('i64 could not handle more than 32 bits');
      }
      data = `${this.type}.load${bits}_${flag}`;
    }
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method store
   * @param {Number} bits - the number of bits to load
   */
  store(bits) {
    let data = `${this.type}.store`;
    if (bits) {
      if (bits % 8 !== 0 || bits <= 0) {
        throw new TypeError('the bits could only be 8x');
      }
      if (this.type === 'i32' && bits > 16) {
        throw new RangeError('i32 could not handle more than 16 bits');
      }
      if (this.type === 'i64' && bits > 32) {
        throw new RangeError('i64 could not handle more than 32 bits');
      }
      data += (bits);
    }
    if (typeof this._onresult === 'function') {
      this._onresult(data);
    }
    return data;
  }
  /**
   * @method const
   * @param {String} val
   */
  const(val) {
    const data = `${this.type}.const ${val}`;
    if (typeof this._onresult === 'function') {
      this._onresult(data);
    }
    return data;
  }
  /**
   * @method add
   */
  add() {
    const data = `${this.type}.add`;
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method sub
   */
  sub() {
    const data = `${this.type}.sub`;
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method mul
   */
  mul() {
    const data = `${this.type}.mul`;
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method div
   * @param {String} flag - "s" or "u"
   */
  div(flag) {
    if (flag !== 's' || flag !== 'u') {
      throw new TypeError('the flag could only be "s"(signed) or "u"(unsigned)');
    }
    const data = `${this.type}.div_${flag}`;
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method rem
   * @param {String} flag - "s" or "u"
   */
  rem(flag) {
    if (this.type !== 'i32' || this.type !== 'i64') {
      throw new TypeError('i32/i64 doesnt have this function');
    }
    if (flag !== 's' || flag !== 'u') {
      throw new TypeError('the flag could only be "s"(signed) or "u"(unsigned)');
    }
    const data = `${this.type}.rem_${flag}`;
    if (typeof this._onresult === 'function') {
      this._onresult(data)
    }
    return data;
  }
  /**
   * @method as
   * @param {String} local - result/param/local
   * @return {WATNumber}
   */
  as(local) {
    this._for = local;
    return this;
  }
  /**
   * @method set
   * @param {String} the local/param name.
   * @return {WATNumber}
   */
  set(name) {
    this._name = name;
    return this;
  }
  /**
   * @property {Object} data - return the sexpression object.
   * @getter
   */
  get data() {
    const nodes = this._name ? [this._name] : [];
    nodes.push(this.type);
    return sexp(this._for, nodes);
  }
}

// exposes WATNumber on exports/wat
Object.defineProperty(wat, 'i32', {
  get() {
    return new WATNumber('i32');
  }
});
Object.defineProperty(wat, 'i64', {
  get() {
    return new WATNumber('i64');
  }
});
Object.defineProperty(wat, 'f32', {
  get() {
    return new WATNumber('f32');
  }
});
Object.defineProperty(wat, 'f64', {
  get() {
    return new WATNumber('f64');
  }
});

/**
 * @class WATFunction
 */
class WATFunction {
  /**
   * @method constructor
   * @param {String} name
   * @param {Object} locals
   * @param {Function} body
   * @return {WATFunction}
   */
  constructor(name, locals, body) {
    this.name = name;
    this.locals = locals;
    this.body = body;
  }
  /**
   * @method getRenderedLocals
   */
  getRenderedLocals() {
    const locals = [];
    for (let name in this.locals) {
      const val = this.locals[name];
      if (name === 'result') {
        locals.push(val.as('result').data);
      } else if (!isNaN(parseInt(name))) {
        locals.push(val.data);
      } else {
        locals.push(val.set(name).data);
      }
    }
    return locals;
  }
  /**
   * @method getRenderedBody
   */
  getRenderedBody() {
    const instructions = [];
    function onresult(result) {
      instructions.push(result);
    }

    const ctx = {
      // local variables
      get(index) {
        onresult(`get_local ${index}`);
      },
      set(index) {
        onresult(`set_local ${index}`);
      },
      // global variables
      gget(index) {
        onresult(`get_global ${index}`);
      },
      gset(index) {
        onresult(`set_global ${index}`);
      },
      // control flow
      nop() {
        onresult('nop');
      },
      block() {
        onresult('block');
      },
      end() {
        onresult('end');
      }
      // calls
      call(name) {
        onresult(`call ${name}`);
      },
      i32: new WATNumber('i32', onresult),
      i64: new WATNumber('i64', onresult),
      f32: new WATNumber('f32', onresult),
      f64: new WATNumber('f64', onresult),
    };
    this.body.apply(ctx);
    return instructions;
  }
  /**
   * @property {Object} data - return the sexpression object.
   * @getter
   */
  get data() {
    let nodes = [this.name];
    nodes = nodes.concat(this.getRenderedLocals());
    if (this.body) {
      nodes = nodes.concat(this.getRenderedBody());
    }
    return sexp('func', nodes);
  }
}

// exposes WATFunction on exports/wat
wat.func = function(name, locals, body) {
  return new WATFunction(name, locals, body);
};

/**
 * @class WATModule
 */
class WATModule {
  /**
   * @method constructor
   */
  constructor() {
    this.imports = {};
    this.exports = {};
  }
  /**
   * @method import
   * @param {String} from - the dot-notion expression corresponding to import object.
   * @param {String} name - the name in WATModule.
   * @param {Object} locals - the locals object.
   */
  import(from, name, locals) {
    this.imports[name] = {
      name, locals, from
    };
  }
  /**
   * @method export
   * @param {String} name - the name.
   * @param {WATFunction} func - the `WATFunction` object to be exported.
   */
  export(name, func) {
    if (func instanceof WATFunction) {
      this.exports[name] = func;
    } else {
      throw new TypeError('WAT module only exports WATFunction');
    }
  }
  /**
   * @method getRenderedImports
   */
  getRenderedImports() {
    const list = [];
    for (let name in this.imports) {
      const data = this.imports[name];
      const nodes = data.from.split('.').map((name) => `"${name}"`);
      nodes.push(wat.func(data.name, data.locals).data);
      const expr = sexp('import', nodes);
      list.push(expr);
    }
    return list;
  }
  /**
   * @method getRenderedExports
   */
  getRenderedExports() {
    const funcsList = [];
    const exportsList = [];
    for (let name in this.exports) {
      const func = this.exports[name];
      const expr = sexp('export', [name, sexp('func', func.name)]);
      funcsList.push(func.data);
      exportsList.push(expr);
    }
    return funcsList.concat(exportsList);
  }
  /**
   * @method toString
   */
  toString() {
    let nodes = this.getRenderedImports();
    nodes = nodes.concat(this.getRenderedExports());
    return sexp('module', nodes).toString();
  }
}

// exposes WATModule to exports/wat.
wat.module = function() {
  return new WATModule();
};

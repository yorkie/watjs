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
      get(index) {
        onresult(`get_local ${index}`);
      },
      set(index) {
        onresult(`set_local ${index}`);
      },
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
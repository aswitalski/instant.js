{
  const Type = {
    GET: 'get',
    KEYS: 'keys',
    LENGTH: 'length',
  };

  const Mode = {
    IDLE: 'idle',
    RECORD: 'record',
    PROPAGATE: 'listen',
  };

  class Dependencies {

    constructor(observer) {
      this.observer = observer;
      this.deps = [];
    }

    add(dependency) {
      this.deps.push(dependency);
    }

    get size() {
      return this.deps.length;
    }
  }

  class Dependency {

    constructor(proxy, type, props) {
      this.proxy = proxy;
      this.type = type;
      Object.assign(this, props);
    }
  }

  class InstantProxy {

    constructor(sandbox) {
      this.sandbox = sandbox;
    }

    onRead(type, props = {}) {
      this.sandbox.register(new Dependency(this.proxy, type, props));
      console.log(
          `  - read: "${type}",`, 'Props:', props, '-', this.sandbox.observer);
    }
  }

  class ObjectProxy extends InstantProxy {

    constructor(source, sandbox) {
      super(sandbox);
      this.proxy = new Proxy(source, {
        set: (target, prop, value) => {
          target[prop] = value;
          return true;
        },
        get: (target, prop) => {
          const value = target[prop];
          if (sandbox.mode === Mode.RECORD) {
            this.onRead(Type.GET, {prop, value});
          }
          return value;
        },
        ownKeys: target => {
          if (sandbox.mode === Mode.RECORD) {
            this.onRead(Type.KEYS);
          }
          return Reflect.ownKeys(target);
        },
      });
      return this.proxy;
    }
  }

  // class ArrayProxy extends InstantProxy {
  //   constructor(source, sandbox) {
  //     super(sandbox);
  //     return new Proxy(source, {
  //       set: (object, key, value, proxy) => {
  //         console.log('key:', key);
  //         debugger;
  //         return true;
  //       },
  //     });
  //   }
  // }

  class Sandbox {

    constructor() {
      this.mode = Mode.IDLE;
      this.source = null;
      this.observer = null;
      this.map = new Map();
      this.proxies = [];
    }

    dependencies(observer) {
      let deps = this.map.get(observer);
      if (deps) {
        return deps;
      }
      deps = new Dependencies(observer);
      this.map.set(observer, deps);
      return deps;
    }

    register(dependency) {
      this.dependencies(this.observer).add(dependency);
    }

    createProxy(source) {
      if (Array.isArray(source)) {
        return new ArrayProxy(source, this);
      }
      if (source.constructor === Object) {
        return new ObjectProxy(source, this);
      }
      throw new Error('Unsupported object type');
    }

    record(observer) {
      this.mode = Mode.RECORD;
      this.observer = observer;
    }

    done() {
      this.mode = Mode.LISTEN;
      this.observer = null;
    }

    proxify(source) {
      this.source = source;
      let proxy = this.createProxy(source);
      this.proxies.push(proxy);
      return proxy;
    }
  }

  class Instant {

    static createSandbox() {
      const sandbox = new Sandbox();
      return sandbox;
    }
  }

  module.exports = Instant;
}

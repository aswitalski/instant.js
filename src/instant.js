{
  const Read = {
    GET: 'get',
    KEYS: 'keys',
    // LENGTH: 'length',
  };

  const Change = {
    SET: 'set',
    DELETE: 'delete',
  };

  const Mode = {
    IDLE: 'idle',
    RECORD: 'record',
    LISTEN: 'listen',
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

    isInterested(amendment) {
      return !!this.deps.find(
          dep => dep.proxy === amendment.proxy &&
              (dep.type === Read.KEYS ||
               dep.type === Read.GET &&
                   dep.props.prop === amendment.props.prop));
    }
  }

  class Dependency {

    constructor(proxy, type, props) {
      this.proxy = proxy;
      this.type = type;
      this.props = props;
    }
  }

  class Amendment {
    constructor(proxy, type, props) {
      this.proxy = proxy;
      this.type = type;
      this.props = props;
    }
  }

  class InstantProxy {

    constructor(sandbox) {
      this.sandbox = sandbox;
    }

    onRead(type, props = {}) {
      this.sandbox.register(new Dependency(this.proxy, type, props));
    }

    onChange(type, props = {}) {
      this.sandbox.queue(new Amendment(this.proxy, type, props));
    }
  }

  class ObjectProxy extends InstantProxy {

    constructor(source, sandbox) {
      super(sandbox);
      this.proxy = new Proxy(source, {
        set: (target, prop, value) => {
          target[prop] = value;
          if (sandbox.mode === Mode.LISTEN) {
            this.onChange(Change.SET, {prop, value});
          }
          return true;
        },
        get: (target, prop) => {
          const value = target[prop];
          if (sandbox.mode === Mode.RECORD) {
            this.onRead(Read.GET, {prop, value});
          }
          return value;
        },
        ownKeys: target => {
          if (sandbox.mode === Mode.RECORD) {
            this.onRead(Read.KEYS);
          }
          return Reflect.ownKeys(target);
        },
      });
      return this.proxy;
    }
  }

  class ArrayProxy extends InstantProxy {

    constructor(source, sandbox) {
      super(sandbox);
      throw new Error('Not implemented!');
    }
  }

  class Sandbox {

    constructor() {
      this.mode = Mode.IDLE;
      this.source = null;
      this.observer = null;
      this.proxies = [];
      this.map = new Map();
      this.pending = new Set();
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

    notify() {
      console.log('Updated components:', this.pending.size);
      this.pending.clear();
    }

    queue(amendment) {
      // console.log('  - write:', amendment.type, amendment.props);
      for (const entry of this.map.entries()) {
        const [observer, dependencies] = entry;
        if (dependencies.isInterested(amendment)) {
          if (this.pending.size === 0) {
            setTimeout(() => this.notify());
          }
          this.pending.add(observer);
        }
      }
    }

    register(dependency) {
      // console.log('  - read:', dependency.type, dependency.props);
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

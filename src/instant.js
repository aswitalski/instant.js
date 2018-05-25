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

    constructor(state, sandbox) {
      super(sandbox);
      throw new Error('Not implemented!');
    }
  }

  class Sandbox {

    constructor(state) {

      /** Indicates what operation is ongoing. */
      this.mode = Mode.IDLE;

      /** State object. */
      this.state = state;

      /** List of managed proxies. */
      this.proxies = [];

      /** Observable model. */
      this.model = this.proxify(state);

      /** Currently recorded observer. */
      this.observer = null;

      /** Observer to Dependencies mapping. */
      this.registry = new Map();

      /** Unique list of observers pending update. */
      this.pending = new Set();
    }

    /** Creates a proxy and adds it to the list of managed proxies. */
    proxify(state) {
      let proxy = this.createProxy(state);
      this.proxies.push(proxy);
      return proxy;
    }

    /** Creates a proxy for given source. */
    createProxy(source) {
      if (Array.isArray(source)) {
        return new ArrayProxy(source, this);
      }
      if (source.constructor === Object) {
        return new ObjectProxy(source, this);
      }
      throw new Error('Unsupported object type');
    }

    dependencies(observer) {
      let deps = this.registry.get(observer);
      if (deps) {
        return deps;
      }
      deps = new Dependencies(observer);
      this.registry.set(observer, deps);
      return deps;
    }

    notify() {
      if (this.listener) {
        this.listener([...this.pending]);
      }
      this.pending.clear();
    }

    queue(amendment) {
      // console.log('  - write:', amendment.type, amendment.props);
      for (const entry of this.registry.entries()) {
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

    record(observer) {
      this.mode = Mode.RECORD;
      this.observer = observer;
    }

    listen(listener) {
      console.assert(
          typeof listener === 'function', 'The listener must be a function');
      this.listener = listener;
    }

    stop() {
      this.mode = Mode.LISTEN;
      this.observer = null;
    }
  }

  class Instant {

    /** Creates a new sandbox for given state. */
    static createSandbox(state) {
      if (!state) {
        throw new Error('The initial state object is mandatory');
      }
      return new Sandbox(state);
    }
  }

  module.exports = Instant;
}

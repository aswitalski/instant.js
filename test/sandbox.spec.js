class Observer {
  constructor(id) {
    this.id = id;
  }
}

describe('Sandbox', () => {

  describe('=> record', () => {

    it('supports "get" property operation', () => {

      // given
      const observer = new Observer(1);
      const sandbox = Instant.createSandbox({
        id: 666,
        header: 'Header',
        footer: 'Footer',
      });

      // when
      sandbox.record(observer);

      sandbox.model.id;
      sandbox.model.header;
      sandbox.model.footer;

      sandbox.stop();

      // then
      assert.equal(sandbox.proxies.length, 1);
      assert.equal(sandbox.dependencies(observer).size, 3);
    });

    it('supports "own keys" operation', () => {

      // given
      const observer = new Observer(2);
      const sandbox = Instant.createSandbox({
        a: 'A',
        b: 'B',
        c: 'C',
      });

      // when
      sandbox.record(observer);
      Object.keys(sandbox.model).forEach(prop => sandbox.model[prop]);
      sandbox.stop();

      // then
      assert.equal(sandbox.proxies.length, 1);
      assert.equal(sandbox.dependencies(observer).size, 4);
    });

    it('supports reusing proxy for different observers', () => {

      // given
      const firstObserver = new Observer(1);
      const secondObserver = new Observer(2);
      const sandbox = Instant.createSandbox({
        foo: 'foo',
        bar: 'bar',
      });

      // when
      sandbox.record(firstObserver);
      sandbox.model.foo;
      sandbox.stop();

      sandbox.record(secondObserver);
      sandbox.model.bar;
      sandbox.stop();

      // then
      assert.equal(sandbox.proxies.length, 1);
      assert.equal(sandbox.dependencies(firstObserver).size, 1);
      assert.equal(sandbox.dependencies(secondObserver).size, 1);
    });
  });
});

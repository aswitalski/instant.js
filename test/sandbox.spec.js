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
  });

  describe('=> modify', () => {

    it('changing property triggers notifications', () => {

      // given
      const propertyObserver = new Observer(1);
      const sandbox = Instant.createSandbox({
        foo: 'bar',
      });
      sandbox.record(propertyObserver);
      sandbox.model.foo;
      sandbox.stop();

      const keysObserver = new Observer(2);
      sandbox.record(keysObserver);
      Object.keys(sandbox.model);
      sandbox.stop();

      // when
      sandbox.model.foo = 'updated';

      assert.equal(sandbox.pending.size, 2);
      assert(sandbox.pending.has(propertyObserver));
      assert(sandbox.pending.has(keysObserver));

      sandbox.listen(components => {
        console.log('Components:', components);
      });
    });
  });
});

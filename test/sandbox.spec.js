class Component {
  constructor(id) {
    this.id = id;
  }
}

describe('Sandbox', () => {

  describe('=> record', () => {

    it('supports "get" property operation', () => {

      // given
      const component = new Component(1);
      const sandbox = Instant.createSandbox({
        id: 666,
        header: 'Header',
        footer: 'Footer',
      });

      // when
      sandbox.record(component);

      sandbox.model.id;
      sandbox.model.header;
      sandbox.model.footer;

      sandbox.stop();

      // then
      assert.equal(sandbox.proxies.length, 1);
      assert.equal(sandbox.dependencies(component).size, 3);
    });

    it('supports "own keys" operation', () => {

      // given
      const component = new Component(2);
      const sandbox = Instant.createSandbox({
        a: 'A',
        b: 'B',
        c: 'C',
      });

      // when
      sandbox.record(component);
      Object.keys(sandbox.model).forEach(prop => sandbox.model[prop]);
      sandbox.stop();

      // then
      assert.equal(sandbox.proxies.length, 1);
      assert.equal(sandbox.dependencies(component).size, 4);
    });
  });
});

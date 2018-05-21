const assert = require('assert');
const Instant = require('../instant.js');

class Component {
  constructor(id, render) {
    this.id = id;
    this.render = render;
  }
}

describe('Sandbox', () => {

  it('records "get" operations', () => {

    // given
    const component = new Component(
        1,
        props =>
            ['section', {
              dataset: {
                id: props.id,
              },
            },
             [
               'span',
               props.header,
             ],
             [
               'span',
               props.footer,
             ],
    ]);

    const sandbox = Instant.createSandbox();
    const model = sandbox.proxify({
      id: 666,
      header: 'Header',
      footer: 'Footer',
    });

    // when
    sandbox.record(component);
    component.render(model);
    sandbox.done();

    // then
    assert.equal(sandbox.proxies.length, 1);
    assert.equal(sandbox.dependencies(component).size, 3);
  });

  it('records "keys" operation', () => {

    // given
    const component = new Component(
        2,
        props =>
            ['main',
             ...Object.entries(props).map(
                 ([key, value]) =>
                     ['div',
                      [
                        'span',
                        `Key: ${key}`,
                      ],
                      [
                        'span',
                        `Value: ${value}`,
                      ],
    ]),
    ]);

    const sandbox = Instant.createSandbox();
    const model = sandbox.proxify({
      a: 'A',
      b: 'B',
      c: 'C',
    });

    // when
    sandbox.record(component);
    component.render(model);
    sandbox.done();

    // then
    assert.equal(sandbox.proxies.length, 1);
    assert.equal(sandbox.dependencies(component).size, 4);
  });

});

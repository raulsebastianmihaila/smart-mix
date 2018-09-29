'use strict';

const mixin = require('../src/mixin.js');

describe('mixin', () => {
  test('the mixin callback must be a function', () => {
    expect.assertions(1);
    expect(mixin).toThrowError('The mixin callback must be a function.');
  });

  test('if contextMethods is passed the context is an object', () => {
    expect.assertions(1);
    expect(() => mixin(() => {})({contextMethods: []}))
      .toThrowError('The context must be an object when contextMethods is provided.');
  });

  test('if contextMethods has content the mixin callback must return a value'
    + ' that can have methods', () => {
      expect.assertions(1);
      expect(() => mixin(() => {})({context: {}, contextMethods: ['x']}))
        .toThrowError();
    });

  test('if mixMethods has content the mixin callback must return a value'
    + ' that can have methods', () => {
      expect.assertions(1);
      expect(() => mixin(() => {})({mixMethods: ['x']}))
        .toThrowError();
    });

  test('can not mix in existing prop on context', () => {
    expect.assertions(1);
    expect(() => mixin(() => {})({context: {x: 1}, contextMethods: ['x']}))
      .toThrowError('x was already mixed in.');
  });

  test('can not mix in existing prop on mix', () => {
    expect.assertions(1);
    expect(() => mixin(() => ({x() {}}))({mixMethods: ['x', 'x']}))
      .toThrowError('x was already mixed in.');
  });

  test('a mixin method must be a function', () => {
    expect.assertions(2);
    expect(() => mixin(() => ({}))({context: {}, contextMethods: ['x']}))
      .toThrowError('The mixin method must be a function.');
    expect(() => mixin(() => ({}))({mixMethods: ['x']}))
      .toThrowError('The mixin method must be a function.');
  });

  test('a mixin key can be a symbol', () => {
    expect.assertions(2);

    const context = {};
    const key = Symbol();
    const mix = mixin(() => ({
      [key]() { return 1; }
    }))({context, contextMethods: [key], mixMethods: [key]});

    expect(context[key]()).toBe(1);
    expect(mix[key]()).toBe(1);
  });

  test('the same method can be mixed in the context and the mix', () => {
    expect.assertions(3);

    const context = {};
    const mix = mixin(() => ({
      func() { return 1; }
    }))({context, contextMethods: ['func'], mixMethods: ['func']});

    expect(context.func()).toBe(1);
    expect(mix.func()).toBe(1);
    expect(context.func).toBe(mix.func);
  });

  test('the mixin callback receives the context and the state', () => {
    expect.assertions(2);

    const context = {};
    const state = {};

    mixin((context_, state_) => {
      expect(context_).toBe(context);
      expect(state_).toBe(state);
    })({context, state});
  });

  test('the contextMethods are set on the context', () => {
    expect.assertions(2);

    const context = {};

    mixin(() => ({
      method1() { return 1; },
      method2() { return 2; }
    }))({context, contextMethods: ['method1', 'method2']});

    expect(context.method1()).toBe(1);
    expect(context.method2()).toBe(2);
  });

  test('the mix object is returned', () => {
    expect.assertions(1);

    const mix = mixin(() => ({func() {}}))({mixMethods: ['func']});

    expect(typeof mix.func).toBe('function');
  });

  test('the mixMethods are set on the mix', () => {
    expect.assertions(2);

    const mix = mixin(() => ({
      method1() { return 1; },
      method2() { return 2; }
    }))({mixMethods: ['method1', 'method2']});

    expect(mix.method1()).toBe(1);
    expect(mix.method2()).toBe(2);
  });

  test('each mixin instantiation has its own private scope', () => {
    expect.assertions(4);

    const mixinFunc = mixin(() => {
      let x = 0;

      return {
        getX() {
          return x;
        },

        updateX() {
          x += 1;
        }
      };
    });
    const mix1 = mixinFunc({mixMethods: ['getX', 'updateX']});
    const mix2 = mixinFunc({mixMethods: ['getX', 'updateX']});

    expect(mix1.getX()).toBe(0);
    expect(mix2.getX()).toBe(0);
    mix1.updateX();
    expect(mix1.getX()).toBe(1);
    expect(mix2.getX()).toBe(0);
  });

  test('each mixin instantiation produces new methods', () => {
    expect.assertions(2);

    const mixinFunc = mixin(() => {
      return {
        method() {}
      };
    });
    const mix1 = mixinFunc({mixMethods: ['method']});
    const mix2 = mixinFunc({mixMethods: ['method']});

    expect(mix1.method === mix2.method).toBe(false);

    const context1 = {};
    const context2 = {};

    mixinFunc({context: context1, contextMethods: ['method']});
    mixinFunc({context: context2, contextMethods: ['method']});

    expect(context1.method === context2.method).toBe(false);
  });

  test('each mix instantiation has separate arguments from the others', () => {
    expect.assertions(2);

    const mixinFunc = mixin((context, state) => {
      return {
        getResult() {
          return context.x + state.x;
        }
      };
    });
    const mix1 = mixinFunc({context: {x: 1}, state: {x: 2}, mixMethods: ['getResult']});
    const mix2 = mixinFunc({context: {x: 100}, state: {x: 200}, mixMethods: ['getResult']});

    expect(mix1.getResult()).toBe(3);
    expect(mix2.getResult()).toBe(300);
  });

  test('the mixin methods can call other mixin methods and use the context an state', () => {
    expect.assertions(2);

    const mixinFunc = mixin((context, state) => {
      let x = 0;

      const methods = {
        publicMethod2() {
          x += 1;

          return context.y + 5 + x + state.z;
        },

        internalMethod1() {
          x += 1;

          return 1000 + context.publicMethod1() + methods.someOtherMethod1() + state.w + x;
        },

        someOtherMethod1() {
          return 0.5 + context.u;
        }
      };

      return methods;
    });

    const context = {
      x: 200,
      y: 1000,
      u: 50000,

      publicMethod1() {
        return this.x + 100;
      }
    };
    const state = {
      z: 10000,
      w: 100000
    };
    const mix = mixinFunc({
      context,
      state,
      mixMethods: ['internalMethod1'],
      contextMethods: ['publicMethod2']
    });

    expect(context.publicMethod2()).toBe(11006);
    expect(mix.internalMethod1()).toBe(151302.5);
  });

  test('works with classes', () => {
    expect.assertions(2);

    const mixinFunc = mixin((context, state) => {
      let x = 0;

      const methods = {
        publicMethod2() {
          x += 1;

          return context.y + 5 + x + state.z;
        },

        internalMethod1() {
          x += 1;

          return 1000 + context.publicMethod1() + methods.someOtherMethod1() + state.w + x;
        },

        someOtherMethod1() {
          return 0.5 + context.u;
        }
      };

      return methods;
    });

    class Context {
      constructor() {
        this.x = 200;
        this.y = 1000;
        this.u = 50000;

        const state = {
          z: 10000,
          w: 100000
        };
        const mix = mixinFunc({
          context: this,
          state,
          mixMethods: ['internalMethod1'],
          contextMethods: ['publicMethod2']
        });

        expect(this.publicMethod2()).toBe(11006);
        expect(mix.internalMethod1()).toBe(151302.5);
      }

      publicMethod1() {
        return this.x + 100;
      }
    }

    new Context();
  });
});

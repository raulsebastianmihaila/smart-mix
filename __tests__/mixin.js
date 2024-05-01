import mixin from '../src/mixin.js';

describe('mixin', () => {
	test('the mixin callback must be a function', () => {
		expect.assertions(1);
		expect(mixin).toThrowError('The mixin callback must be a function.');
	});

	test('if publicMethods is passed the publicContext is an object', () => {
		expect.assertions(1);
		expect(() => mixin(() => {})({publicMethods: []}))
			.toThrowError('The publicContext must be an object when publicMethods is provided.');
	});

	test('if publicMethods has content the mixin callback must return a value'
		+ ' that can have methods', () => {
			expect.assertions(1);
			expect(() => mixin(() => {})({publicContext: {}, publicMethods: ['x']}))
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
		expect(() => mixin(() => {})({publicContext: {x: 1}, publicMethods: ['x']}))
		    .toThrowError('x was already mixed in.');
	});

	test('can not mix in existing prop on mix', () => {
		expect.assertions(1);
		expect(() => mixin(() => ({x() {}}))({mixMethods: ['x', 'x']}))
			.toThrowError('x was already mixed in.');
	});

	test('a mixin method must be a function', () => {
		expect.assertions(2);
		expect(() => mixin(() => ({}))({publicContext: {}, publicMethods: ['x']}))
			.toThrowError('The mixin method must be a function.');
		expect(() => mixin(() => ({}))({mixMethods: ['x']}))
			.toThrowError('The mixin method must be a function.');
	});

	test('a mixin key can be a symbol', () => {
		expect.assertions(2);

		const publicContext = {};
		const key = Symbol();
		const mix = mixin(() => ({
			[key]() { return 1; }
		}))({publicContext, publicMethods: [key], mixMethods: [key]});

		expect(publicContext[key]()).toBe(1);
		expect(mix[key]()).toBe(1);
	});

    test('a method can be mixed in the publicContext even if there is an inherited non-writable'
        + ' property with the same key', () => {
            expect.assertions(1);

            const proto = {};

            Object.defineProperty(proto, 'func', {writable: false});

            const publicContext = Object.create(proto);

            mixin(() => ({
                func() { return 1; }
            }))({publicContext, publicMethods: ['func']});

            expect(publicContext.func()).toBe(1);
        });

	test('the same method can be mixed in the publicContext and the mix', () => {
		expect.assertions(3);

		const publicContext = {};
		const mix = mixin(() => ({
			func() { return 1; }
		}))({publicContext, publicMethods: ['func'], mixMethods: ['func']});

		expect(publicContext.func()).toBe(1);
		expect(mix.func()).toBe(1);
		expect(publicContext.func).toBe(mix.func);
	});

	test('the mixin callback receives the publicContext and the sharedContext', () => {
		expect.assertions(2);

		const publicContext = {};
		const sharedContext = {};

		mixin((publicContext_, sharedContext_) => {
			expect(publicContext_).toBe(publicContext);
			expect(sharedContext_).toBe(sharedContext);
		})({publicContext, sharedContext});
	});

	test('the publicMethods are set on the publicContext', () => {
		expect.assertions(2);

		const publicContext = {};

		mixin(() => ({
			method1() { return 1; },
			method2() { return 2; }
		}))({publicContext, publicMethods: ['method1', 'method2']});

		expect(publicContext.method1()).toBe(1);
		expect(publicContext.method2()).toBe(2);
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

		const publicContext1 = {};
		const publicContext2 = {};

		mixinFunc({publicContext: publicContext1, publicMethods: ['method']});
		mixinFunc({publicContext: publicContext2, publicMethods: ['method']});

		expect(publicContext1.method === publicContext2.method).toBe(false);
	});

	test('each mix instantiation has separate arguments from the others', () => {
		expect.assertions(2);

		const mixinFunc = mixin((publicContext, sharedContext) => {
			return {
				getResult() {
					return publicContext.x + sharedContext.x;
				}
			};
		});
		const mix1 = mixinFunc({publicContext: {x: 1}, sharedContext: {x: 2}, mixMethods: ['getResult']});
		const mix2 = mixinFunc({publicContext: {x: 100}, sharedContext: {x: 200}, mixMethods: ['getResult']});

		expect(mix1.getResult()).toBe(3);
		expect(mix2.getResult()).toBe(300);
	});

	test('the mixin methods can call other mixin methods and use the publicContext and sharedContext', () => {
		expect.assertions(2);

		const mixinFunc = mixin((publicContext, sharedContext) => {
			let x = 0;

			const methods = {
				publicMethod2() {
					x += 1;

					return publicContext.y + 5 + x + sharedContext.z;
				},

				internalMethod1() {
					x += 1;

					return 1000 + publicContext.publicMethod1() + methods.someOtherMethod1() + sharedContext.w + x;
				},

				someOtherMethod1() {
					return 0.5 + publicContext.u;
				}
			};

			return methods;
		});

		const publicContext = {
			x: 200,
			y: 1000,
			u: 50000,

			publicMethod1() {
				return this.x + 100;
			}
		};
		const sharedContext = {
			z: 10000,
			w: 100000
		};
		const mix = mixinFunc({
			publicContext,
			sharedContext,
			mixMethods: ['internalMethod1'],
			publicMethods: ['publicMethod2']
		});

		expect(publicContext.publicMethod2()).toBe(11006);
		expect(mix.internalMethod1()).toBe(151302.5);
	});

	test('works with classes', () => {
		expect.assertions(2);

		const mixinFunc = mixin((publicContext, sharedContext) => {
			let x = 0;

			const methods = {
				publicMethod2() {
					x += 1;

					return publicContext.y + 5 + x + sharedContext.z;
				},

				internalMethod1() {
					x += 1;

					return 1000 + publicContext.publicMethod1() + methods.someOtherMethod1() + sharedContext.w + x;
				},

				someOtherMethod1() {
					return 0.5 + publicContext.u;
				}
			};

			return methods;
		});

		class Context {
			constructor() {
				this.x = 200;
				this.y = 1000;
				this.u = 50000;

				const sharedContext = {
					z: 10000,
					w: 100000
				};
				const mix = mixinFunc({
					publicContext: this,
					sharedContext,
					mixMethods: ['internalMethod1'],
					publicMethods: ['publicMethod2']
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

	test('when attaching getPublicContext the publicContext must be an object', () => {
		expect.assertions(1);

		const mixinFunc = mixin(() => {});

		mixinFunc.getPublicContext = () => {};

		expect(() => mixinFunc({define: true}))
			.toThrowError('The publicContext must be an object when getPublicContext is provided.');
	});

	test('when attaching getSharedContext the sharedContext must be an object', () => {
		expect.assertions(1);

		const mixinFunc = mixin(() => {});

		mixinFunc.getSharedContext = () => {};

		expect(() => mixinFunc({define: true}))
			.toThrowError('The sharedContext must be an object when getSharedContext is provided.');
	});

	test('getPublicContext receives the publicContext and the sharedContext', () => {
		expect.assertions(2);

		const publicContext = {};
		const sharedContext = {};
		const mixinProvider = mixin(() => {});

		mixinProvider.getPublicContext = (publicContext_, sharedContext_) => {
			expect(publicContext_).toBe(publicContext);
			expect(sharedContext_).toBe(sharedContext);

			return {};
		};

		mixinProvider({define: true, publicContext, sharedContext});
	});

	test('getPublicContext must return an object', () => {
		expect.assertions(1);

		const publicContext = {};
		const mixinProvider = mixin(() => {});

		mixinProvider.getPublicContext = () => {};

		expect(() => mixinProvider({define: true, publicContext})).toThrowError();
	});

	test('getSharedContext receives the publicContext and the sharedContext', () => {
		expect.assertions(2);

		const publicContext = {};
		const sharedContext = {};
		const mixinProvider = mixin(() => {});

		mixinProvider.getSharedContext = (publicContext_, sharedContext_) => {
			expect(publicContext_).toBe(publicContext);
			expect(sharedContext_).toBe(sharedContext);

			return {};
		};

		mixinProvider({define: true, publicContext, sharedContext});
	});

	test('getSharedContext must return an object', () => {
		expect.assertions(1);

		const sharedContext = {};
		const mixinProvider = mixin(() => {});

		mixinProvider.getSharedContext = () => {};

		expect(() => mixinProvider({define: true, sharedContext})).toThrowError();
	});

	test('result from getPublicContext is installed on the publicContext', () => {
		expect.assertions(3);

		const publicContext = {};
		const mixinProvider = mixin(() => {});
		const extraContext = {
			x: 1,

			get y() { return 1; }
		};

		Object.defineProperty(extraContext, 'z', {enumerable: false, configurable: false});

		mixinProvider.getPublicContext = () => extraContext;

		mixinProvider({define: true, publicContext});

		expect(Object.getOwnPropertyDescriptor(publicContext, 'x'))
			.toEqual(Object.getOwnPropertyDescriptor(extraContext, 'x'));
		expect(Object.getOwnPropertyDescriptor(publicContext, 'y'))
			.toEqual(Object.getOwnPropertyDescriptor(extraContext, 'y'));
		expect(Object.getOwnPropertyDescriptor(publicContext, 'z'))
			.toEqual(Object.getOwnPropertyDescriptor(extraContext, 'z'));
	});

	test('result from getSharedContext is installed on the sharedContext', () => {
		expect.assertions(3);

		const sharedContext = {};
		const mixinProvider = mixin(() => {});
		const extraState = {
			x: 1,

			get y() { return 1; }
		};

		Object.defineProperty(extraState, 'z', {enumerable: false, configurable: false});

		mixinProvider.getSharedContext = () => extraState;

		mixinProvider({define: true, sharedContext});

		expect(Object.getOwnPropertyDescriptor(sharedContext, 'x'))
			.toEqual(Object.getOwnPropertyDescriptor(extraState, 'x'));
		expect(Object.getOwnPropertyDescriptor(sharedContext, 'y'))
			.toEqual(Object.getOwnPropertyDescriptor(extraState, 'y'));
		expect(Object.getOwnPropertyDescriptor(sharedContext, 'z'))
			.toEqual(Object.getOwnPropertyDescriptor(extraState, 'z'));;
	});
});

(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  // the mixin function takes a mixin callback in order to create a mixin provider function.
  // the mixin provider function mixes methods on certain target objects.
  // when calling the mixin provider function, the mixin callback is passed the optional context
  // and optional state options in order to obtain the mixin methods container object.
  // the context is the target of the optional contextMethods option, which is an array of keys
  // used to get the mixin methods from the mixin methods container object.
  // a new mix object is created and returned.
  // the optional mixMethods option is an array of keys used to get the mixin methods from
  // the mixin methods container object and set them on the mix object.
  const mixin = (mixinFunc) => {
    if (!isFunc(mixinFunc)) {
      throw new Error('The mixin callback must be a function.');
    }

    return ({context, state, contextMethods, mixMethods}) => {
      const mixinMethods = mixinFunc(context, state);
      const mix = {};

      if (contextMethods) {
        if (!isObj(context)) {
          throw new Error('The context must be an object when contextMethods is provided.');
        }

        setMethods(contextMethods, context, mixinMethods);
      }

      if (mixMethods) {
        setMethods(mixMethods, mix, mixinMethods);
      }

      return mix;
    };
  };

  const setMethods = (methods, target, mixinMethods) => {
    methods.forEach((key) => {
      if (hasOwnProp(target, key)) {
        throw new Error(`${key} was already mixed in.`);
      }

      const method = mixinMethods[key];

      if (!isFunc(method)) {
        throw new Error('The mixin method must be a function.');
      }

      target[key] = method;
    });
  };

  const isObj = (value) => !!value && typeof value === 'object';

  const isFunc = (value) => typeof value === 'function';

  const hasOwnProp = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

  const moduleExports = mixin;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.mixin = moduleExports;
  }
})();

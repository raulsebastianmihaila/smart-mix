// the mixin function takes a mixin callback in order to create a mixin provider function.
// the mixin provider function mixes methods on certain target objects.
// when calling the mixin provider function, the mixin callback is passed the optional context
// and optional state options in order to obtain the mixin methods container object.
// the context is the target of the optional contextMethods option, which is an array of keys
// used to get the mixin methods from the mixin methods container object.
// a new mix object is created and returned.
// the optional mixMethods option is an array of keys used to get the mixin methods from
// the mixin methods container object and set them on the mix object.
// the meta option can be used to tell the mixin mechanism to lookup the getContext and
// getState static methods on the mixin provider function and use any of the
// ones it finds to populate the context and state objects that were passed with properties.
// the results from getContext are defined into the context object. the results from
// getState are defined into the state object. these functions are called with the context
// and state objects and they can return an object that provides property descriptors
// which are used to define properties on the target object.
export default (mixinFunc) => {
  if (!isFunc(mixinFunc)) {
    throw new Error('The mixin callback must be a function.');
  }

  const mixinProvider = ({context, state, contextMethods, mixMethods, meta}) => {
    const mixinMethods = mixinFunc(context, state);
    const mix = {};

    if (meta) {
      if (mixinProvider.getContext) {
        if (!isObj(context)) {
          throw new Error('The context must be an object when getContext is provided.');
        }

        Object.defineProperties(
          context,
          Object.getOwnPropertyDescriptors(mixinProvider.getContext(context, state)));
      }

      if (mixinProvider.getState) {
        if (!isObj(state)) {
          throw new Error('The state must be an object when getState is provided.');
        }

        Object.defineProperties(
          state,
          Object.getOwnPropertyDescriptors(mixinProvider.getState(context, state)));
      }
    }

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

  return mixinProvider;
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

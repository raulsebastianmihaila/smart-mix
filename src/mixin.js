const isObj = (value) => !!value && typeof value === 'object';

const isFunc = (value) => typeof value === 'function';

const mixin = (mixinFunc) => {
    // the mixin function takes a mixin callback in order to create a mixin provider function.
    // the mixin provider function mixes methods on certain target objects.
    // when calling the mixin provider function, the mixin callback is passed the optional
    // publicContext and optional sharedContext options in order to obtain the mixin methods
    // container object. the publicContext is the target of the optional publicMethods option,
    // which is an array of keys used to get the mixin methods from the mixin methods container
    // object. a new mix object is created and returned. the optional mixMethods option is an array
    // of keys used to get the mixin methods from the mixin methods container object and set them
    // on the mix object. the define option can be used to tell the mixin mechanism
    // to lookup the getPublicContext and getSharedContext static methods on the mixin provider
    // function and use any of the ones it finds to populate the publicContext and sharedContext
    // objects that were passed with properties. the results from getPublicContext are defined
    // into the publicContext object. the results from getSharedContext are defined into
    // the sharedContext object. these functions are called with the publicContext
    // and sharedContext objects and they can return an object that provides property descriptors
    // which are used to define properties on the target object.

    if (!isFunc(mixinFunc)) {
        throw new Error('The mixin callback must be a function.');
    }

    const mixinProvider = ({
        publicContext,
        sharedContext,
        publicMethods,
        mixMethods,
        define
    }) => {
        const mixinMethods = mixinFunc(publicContext, sharedContext);
        const mix = {};

        if (define) {
            if (mixinProvider.getPublicContext) {
                if (!isObj(publicContext)) {
                    throw new Error(
                        'The publicContext must be an object when getPublicContext is provided.');
                }

                Object.defineProperties(
                    publicContext,
                    Object.getOwnPropertyDescriptors(
                        mixinProvider.getPublicContext(publicContext, sharedContext)));
            }

            if (mixinProvider.getSharedContext) {
                if (!isObj(sharedContext)) {
                    throw new Error(
                        'The sharedContext must be an object when getSharedContext is provided.');
                }

                Object.defineProperties(
                    sharedContext,
                    Object.getOwnPropertyDescriptors(
                        mixinProvider.getSharedContext(publicContext, sharedContext)));
            }
        }

        if (publicMethods) {
            if (!isObj(publicContext)) {
                throw new Error(
                    'The publicContext must be an object when publicMethods is provided.');
            }

            defineMethods(publicMethods, publicContext, mixinMethods);
        }

        if (mixMethods) {
            defineMethods(mixMethods, mix, mixinMethods);
        }

        return mix;
    };

    return mixinProvider;
};

export default mixin;

const defineMethods = (methodsList, target, mixinMethods) => {
    methodsList.forEach((key) => {
        if (Object.hasOwn(target, key)) {
            throw new Error(`${key} was already mixed in.`);
        }

        const method = mixinMethods[key];

        if (!isFunc(method)) {
            throw new Error('The mixin method must be a function.');
        }

        Object.defineProperty(
            target,
            key,
            {
                value: method,
                writable: true,
                enumerable: false,
                configurable: true
            });
    });
};

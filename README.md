# smart-mix

OOP composition-based mixin tool like no other.

## Contents
- [Installation](#installation)
- [Properties](#properties)
- [Advantages over other mixin approaches](#advantages)
- [Examples](#examples)
- [Concepts](#concepts)

<a name="installation"></a>
## Installation
`npm i smart-mix`

<a name="properties"></a>
## Properties
- mixes in public methods
- mixes in private/shared methods
- allows mixing in data and accessor properties
- allows sharing private state and public state
- each instance of the mixin has its own state
- avoids keys collisions
- works both with symbols and string keys
- avoids the gorilla-banana problem by getting only the methods you need
- works both in function contexts and class contexts
- you clearly see what your object has mixed in in its definition context
- you clearly see where your mixed in capabilities come from

<a name="advantages"></a>
## Advantages over other mixin approaches

The common ways mixins have been implemented so far were:
    - naive approach - Object.assign, Reactjs mixins, Typescript mixins
    - based on prototypal inheritance
    - [functional mixins](https://medium.com/javascript-scene/functional-mixins-composing-software-ffb66d5e731c)

The main downsides of these approaches are:
    - Not being able to easily tell what your class/object can do by simply looking at its definition context (and having to jump to different files)
    - Not being able to easily tell where your class'/object's capabilities come from by simply looking at its definition context
    - Avoiding property collisions by making the last mixin object always win (which is not the best solution)
    - The gorilla-banana problem. You automatically get all the methods in the mixin objects even though you might not need all of them. This is a violation of the least knowledge principle.
    - The inability of sharing private state between the mixin context and the mixin functions.

The first 4 issues are solved in a composition based mixin mechanism by explicitly picking every mixin function.

<a name="examples"></a>
## Examples

### Example 1: simple example with sharing methods with two different contexts
```js
// chocolate eater mixin file

import mixin from 'smart-mix';

export default mixin(() => ({
    eatChocolate() {
        console.log('eating chocolate');
    },

    initiateTummyPain() {
        throw new Error('My tummy hurts!');
    }
}));
```

```js
// dancer mixin file

import mixin from 'smart-mix';

export default mixin(() => ({
    dance() {
        console.log('dancing');
    }
}));
```

```js
import chocolateEater from './chocolate-eater-mixin';
import dancer from './dancer-mixin';

class Bob {
    constructor() {
        chocolateEater({
            publicContext: this,
            publicMethods: ['eatChocolate', 'initiateTummyPain']
        });
        dancer({
            publicContext: this,
            publicMethods: ['dance']
        });
    }
}

class Alice {
    constructor() {
        chocolateEater({
            publicContext: this,
            publicMethods: ['eatChocolate']
        });
        dancer({
            publicContext: this,
            publicMethods: ['dance']
        });
    }
}

const bob = new Bob();
const alice = new Alice();

bob.dance(); // dancing
alice.dance(); // dancing
bob.eatChocolate(); // eating chocolate
alice.eatChocolate(); // eating chocolate
bob.initiateTummyPain(); // throws My tummy hurts!
'initiateTummyPain' in alice; // false - alice will not have any tummy pain
```

### Example 2: share private state between two mixin providers
```js
// woman secret keeper mixin

import mixin from 'smart-mix';

export default mixin((publicContext, sharedContext) => {
    return {
        womanUpdateSecret() {
            sharedContext.secret = 'woman secret';
        }
    };
});
```

```js
// man secret keeper mixin

import mixin from 'smart-mix';

export default mixin((publicContext, sharedContext) => {
    return {
        manUpdateSecret() {
            sharedContext.secret = 'man secret';
        }
    };
});
```

```js
import womanSecretKeeper from './woman-secret-keeper-mixin';
import manSecretKeeper from './man-secret-keeper-mixin';

const hybrid = (() => {
    const hybrid = {
        getSecret() {
            console.log(secretBox.secret);
        }
    };

    const secretBox = {};
    const womanMix = womanSecretKeeper({
        sharedContext: secretBox,
        mixMethods: ['womanUpdateSecret']
    });
    const manMix = manSecretKeeper({
        sharedContext: secretBox,
        mixMethods: ['manUpdateSecret']
    });

    womanMix.womanUpdateSecret();
    hybrid.getSecret(); // woman secret
    manMix.manUpdateSecret();

    return hybrid;
})();

hybrid.getSecret(); // man secret
```

### Example 3: each context has its own state
```js
// number mixin

import mixin from 'smart-mix';

export default mixin((publicContext, sharedContext) => {
    let privateMixinProviderNumber;

    return {
        setPrivateMixinProviderNumber(number) {
            privateMixinProviderNumber = number;
        },

        updateSharedNumber(number) {
            sharedContext.number = number;
        },

        getSumResult() {
            return privateMixinProviderNumber + sharedContext.number;
        }
    };
});
```

```js
import numberMixin from './number-mixin';

const publicContext1 = {};
const sharedContext1 = {};

const publicContext2 = {};
const sharedContext2 = {};

numberMixin({
    publicContext: publicContext1,
    sharedContext: sharedContext1,
    publicMethods: [
        'setPrivateMixinProviderNumber', 
        'updateSharedNumber', 
        'getSumResult'
    ]
});

numberMixin({
    publicContext: publicContext2,
    sharedContext: sharedContext2,
    publicMethods: [
        'setPrivateMixinProviderNumber', 
        'updateSharedNumber', 
        'getSumResult'
    ]
});

publicContext1.setPrivateMixinProviderNumber(100);
publicContext1.updateSharedNumber(1000);
publicContext2.setPrivateMixinProviderNumber(200);
publicContext2.updateSharedNumber(2000);
console.log(publicContext1.getSumResult()); // 1100
console.log(publicContext2.getSumResult()); // 2200
```

<a name="concepts"></a>
## Concepts

- The `mixin` function, which is provided by `smart-mix`.
```js
import mixin from 'smart-mix';

mixin();
```
- The `mixin provider function` is obtained by calling the `mixin` function.
```js
const mixinProviderFunction = mixin();
```
- The `mixin callback` is passed to the `mixin` function in order to obtain the `mixin provider
function` and it must return the `mixin methods container object`.
```js
mixin(() => {
    return {
        method() {}
    }
});
```
- The optional `mixin public context` is passed to the `mixin callback` and it becomes the target of the optional `public methods`.
```js
const publicContext = {
    existingMethod() { return 2; }
};

const mixinProviderFunction = mixin((publicContext) => {
    return {
        method() {
            return publicContext.existingMethod() + 1;
        }
    };
});

mixinProviderFunction({
    publicContext,
    publicMethods: ['method']
});

publicContext.method(); // 3
```
- The optional `mixin shared context` is the second argument passed to the `mixin callback` and it can contain any other state, including state that is private in the context in which the `mixin public context` is created.
```js
const publicContext = (() => {
    const publicContext = {};
    const sharedContext = {
        property: 'private message'
    };

    const mixinProviderFunction = mixin((publicContext, sharedContext) => {
        return {
            method() {
                return sharedContext.property;
            }
        };
    })

    mixinProviderFunction({
        publicContext, 
        sharedContext,
        publicMethods: ['method']
    });

    return publicContext;
})();

publicContext.method(); // 'private message'
```
- The `mix object` is returned by the `mixin provider function` and is the target of the optional `mix methods`. This `mix object` can stay private in the context in which the `mixin public context` was created so that the `mixin public context` can use private methods.
```js
const publicContext = (() => {
    const publicContext = {
        existingMethod() { return mix.privateMethod(); }
    };

    const mixinProviderFunction = mixin(() => {
        return {
            privateMethod() {
                return 'private message';
            }
        };
    })

    const mix = mixinProviderFunction({
        mixMethods: ['privateMethod']
    });

    return publicContext;
})();

publicContext.existingMethod(); // 'private message'
```
- Optionally, using the `define` option the resulted mixin provider function can have static methods attached that allows us mix in data and accessor properties. We can use a `getPublicContext` static method that provides properties for the mixin public context object. Also, a `getSharedContext` static method that provides properties for the mixin shared context object. These two functions receive the mixin public context and shared context objects and return an object whose properties will be installed on the mixin public context object or mixin shared context object by applying the same property descriptors of the returned object. This way we can install accessor properties on the mixin public context and shared context objects.
```js
const publicContext = (() => {
    const publicContext = {
        x: 1
    };
    const sharedContext = {
        y: 2
    };

    const mixinProviderFunction = mixin((publicContext, sharedContext) => {
        return {
            getResult() {
                return publicContext.sum;
            }
        };
    })

    mixinProviderFunction.getPublicContext = (publicContext, sharedContext) => ({
        z: 3,

        get sum() {
            return publicContext.x + publicContext.z + sharedContext.y + sharedContext.u;
        }
    });

    mixinProviderFunction.getSharedContext = () => ({
        u: 4
    });

    const mix = mixinProviderFunction({
        define: true,
        publicContext,
        sharedContext,
        publicMethods: ['getResult']
    });

    return publicContext;
})();

console.log(publicContext.getResult()); // 10
```

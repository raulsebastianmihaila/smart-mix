# smart-mix

OOP composition-based mixin tool like no other.

## Contents  
  - [Properties](#properties)
  - [Advantages over other mixin approaches](#advantages)
  - [Examples](#examples)  
  - [Concepts](#concepts)

<a name="properties"></a>
## Properties
- mixes in public methods
- mixes in private methods
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
      context: this,
      contextMethods: ['eatChocolate', 'initiateTummyPain']
    });
    dancer({
      context: this,
      contextMethods: ['dance']
    });
  }
}

class Alice {
  constructor() {
    chocolateEater({
      context: this,
      contextMethods: ['eatChocolate']
    });
    dancer({
      context: this,
      contextMethods: ['dance']
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

export default mixin((context, shared) => {
  return {
    womanUpdateSecret() {
      shared.secret = 'woman secret';
    }
  };
});
```

```js
// man secret keeper mixin

import mixin from 'smart-mix';

export default mixin((context, shared) => {
  return {
    manUpdateSecret() {
      shared.secret = 'man secret';
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
    state: secretBox,
    mixMethods: ['womanUpdateSecret']
  });
  const manMix = manSecretKeeper({
    state: secretBox,
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

export default mixin((context, shared) => {
  let privateMixinProviderNumber;

  return {
    setPrivateMixinProviderNumber(number) {
      privateMixinProviderNumber = number;
    },

    updateSharedNumber(number) {
      shared.number = number;
    },

    getSumResult() {
      return privateMixinProviderNumber + shared.number;
    }
  };
});
```

```js
import numberMixin from './number-mixin';

const context1 = {};
const sharedState1 = {};

const context2 = {};
const sharedState2 = {};

numberMixin({
  context: context1,
  state: sharedState1,
  contextMethods: [
    'setPrivateMixinProviderNumber', 
    'updateSharedNumber', 
    'getSumResult'
  ]
});

numberMixin({
  context: context2,
  state: sharedState2,
  contextMethods: [
    'setPrivateMixinProviderNumber', 
    'updateSharedNumber', 
    'getSumResult'
  ]
});

context1.setPrivateMixinProviderNumber(100);
context1.updateSharedNumber(1000);
context2.setPrivateMixinProviderNumber(200);
context2.updateSharedNumber(2000);
console.log(context1.getSumResult()); // 1100
console.log(context2.getSumResult()); // 2200
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
- The optional `mixin context` is passed to the `mixin callback` and it becomes the target of the
optional `context methods`.
```js
const context = {
  existingMethod() { return 2; }
};

const mixinProviderFunction = mixin((context) => {
  return {
    method() {
      return context.existingMethod() + 1;
    }
  };
})

mixinProviderFunction({
  context,
  contextMethods: ['method']
});

context.method(); // 3
```
- The optional `mixin state` is the second argument passed to the `mixin callback` and it can
contain any other state, including state that is private in the context in which the `mixin context`
is created.
```js
const context = (() => {
  const context = {};
  const privateState = {
    property: 'private message'
  };

  const mixinProviderFunction = mixin((context, privateState) => {
    return {
      method() {
        return privateState.property;
      }
    };
  })

  mixinProviderFunction({
    context, 
    state: privateState,
    contextMethods: ['method']
  });

  return context;
})();

context.method(); // 'private message'
```
- The `mix object` is returned by the `mixin provider function` and is the target of
the optional `mix methods`. This `mix object` can stay private in the context in which the
`mixin context` was created so that the `mixin context` can use private methods.
```js
const context = (() => {
  const context = {
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

  return context;
})();

context.existingMethod(); // 'private message'
```

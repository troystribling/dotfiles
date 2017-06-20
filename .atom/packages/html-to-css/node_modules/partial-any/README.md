# partial-any

A flexible implementation of partial application

## What is it?

This module implements partialAny as described in the article [Ben Alman: Partial Application in JavaScript](http://benalman.com/news/2012/09/partial-application-in-javascript/#partial-application-from-anywhere). Partially apply with data you have available, leave arguments as `undefined` and they will become arguments to the returned function.

## Install

    npm install partial-any

## Usage

    const partialAny = require('partial-any');

A standard left-to-right partial application is done as follows:

    function add(a, b) { return a + b }
    var addOne = partialAny(add, 1);
    // addOne = function(b) { return 1 + b }

Using right-to-left partial application:

    function add(a, b) { return a + b }
    var addOne = partialAny(add, undefined, 1);
    // addOne = function(a) { return a + 1 };

This gives you more control over the way you are able to create partially applied functions. Compose partials together to incrementally build up your functions as they get passed around.

    let myPromise = Promise.reject({ err: 'Its real bad cap', status: 200 });
    let debugCatch = partialAny(console.error, 'Error Dump:', undefined, 'Message:');
    myPromise
      .catch(partialAny(debugCatch, undefined, 'Something went wrong'));
      // The 'undefined' will be filled in with the argument of `catch`

    > Error Dump: { err: 'Its real bad cap', status: 200 } Message: Something went wrong

Please read the `examples/` folder for more examples of partial application.

## Use Case

`partial-any` makes it very easy to arrange your functions into callbacks. You are able to quickly create a partially applied function which will match the signature that a function accepts for it's callback.
 

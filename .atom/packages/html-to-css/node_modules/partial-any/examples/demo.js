'use strict';
const partialAny = require('../lib/');

// Create helper functions that encapsulate complexity
let debug = partialAny(console.log, 'DEBUGGING:');
debug('Easy debugging messages');

let delayedFiveSeconds = partialAny(setTimeout, undefined, 3000);
delayedFiveSeconds(() => console.log('I take 3 seconds to print!'));

// Partially apply from left-to-right, or from right-to-left
let triangleArea = (base, height) => base * height / 2;
let threeFootBaseTriangleArea = partialAny(triangleArea, 3);
let fiveFootHeightTriangleArea = partialAny(triangleArea, undefined, 5);
console.log('Triangles are equal area?: ', threeFootBaseTriangleArea(5) === fiveFootHeightTriangleArea(3));

// Easily craft functions that match Promise callbacks
let myPromise = new Promise(function(resolve, reject) {
  let flip = Math.floor(Math.random() * 2);
  return (flip)
    ? resolve("Congratulations, you won a coin flip")
    : reject({ err: 'Its real bad cap', status: 200 });
});

// partialAny does not bind any context
let debugCatch = partialAny(console.error, 'Error Dump:', undefined, 'Message:');
let success = partialAny(console.log, 'Success!');
myPromise
  .then(success)
  .catch(partialAny(debugCatch, undefined, 'Something went wrong'));


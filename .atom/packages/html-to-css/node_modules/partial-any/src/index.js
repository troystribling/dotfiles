'use strict';

const partial = (fn, ...partialArgs) => {
  return (...restArgs) => {
    var arg = 0;
    for ( var i = 0; i < partialArgs.length && arg < restArgs.length; i++ )
      if ( partialArgs[i] === undefined )
        partialArgs[i] = restArgs[arg++];
    return fn(...partialArgs.concat(restArgs.slice(arg)));
  };
};

module.exports = partial;

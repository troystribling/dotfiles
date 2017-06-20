'use strict';

const partial = function (fn) {
  for (var _len = arguments.length, partialArgs = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    partialArgs[_key - 1] = arguments[_key];
  }

  return function () {
    for (var _len2 = arguments.length, restArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      restArgs[_key2] = arguments[_key2];
    }

    var arg = 0;
    for (var i = 0; i < partialArgs.length && arg < restArgs.length; i++) if (partialArgs[i] === undefined) partialArgs[i] = restArgs[arg++];
    return fn(...partialArgs.concat(restArgs.slice(arg)));
  };
};

module.exports = partial;

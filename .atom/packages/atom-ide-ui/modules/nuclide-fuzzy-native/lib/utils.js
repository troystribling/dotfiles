"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.valueComparator = valueComparator;
exports.scoreComparator = scoreComparator;
exports.inverseScoreComparator = inverseScoreComparator;

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 *  strict
 * @format
 */

/**
 * String comparator that lists the capitalized version of a string before the lowercase version.
 *
 * Apparently String.prototype.localeCompare() is not i18n-aware in Node 0.10.x. There's a ton of
 * debate on this:
 *
 *   https://github.com/joyent/node/issues/6371
 *   https://github.com/joyent/node/issues/7676
 *
 * It appears the version of io.js bundled with Atom has proper i18n support, but it lists
 * lowercase strings before uppercase strings, so we also need this custom function in Atom.
 *
 * @return <0 if a should appear before b in a list; >0 if b should appear before a in a list
 */
function valueComparator(a, b) {
  const len = Math.min(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const charA = a.charAt(i);
    const charB = b.charAt(i);

    if (charA === charB) {
      continue;
    }

    const aUpper = charA.toUpperCase();
    const bUpper = charB.toUpperCase();
    const caseInsensitiveCompare = aUpper.localeCompare(bUpper);

    if (caseInsensitiveCompare !== 0) {
      return caseInsensitiveCompare;
    } // If we have reached this point, charA and charB are different, but only one of them is
    // uppercase. The uppercase one should be returned first.


    return charA === aUpper ? -1 : 1;
  }

  return a.length - b.length;
}
/**
 * @return >0 if a is the greater QueryScore; <0 if b is the greater QueryScore.
 */


function scoreComparator(a, b) {
  const cmp = a.score - b.score;

  if (cmp !== 0) {
    return cmp;
  } else {
    return valueComparator(b.value, a.value);
  }
}

function inverseScoreComparator(a, b) {
  return scoreComparator(b, a);
}
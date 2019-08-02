"use strict";

function _TopScores() {
  const data = _interopRequireDefault(require("../lib/TopScores"));

  _TopScores = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */
describe('TopScores', () => {
  it('.getTopScores() returns the top scores', () => {
    const topScores = new (_TopScores().default)(3);
    const one = {
      score: 1,
      value: 'one'
    };
    const two = {
      score: 2,
      value: 'two'
    };
    const three = {
      score: 3,
      value: 'three'
    };
    const four = {
      score: 4,
      value: 'four'
    };
    const five = {
      score: 5,
      value: 'five'
    };
    const six = {
      score: 6,
      value: 'six'
    };
    topScores.insert(six);
    topScores.insert(four);
    topScores.insert(two);
    topScores.insert(three);
    topScores.insert(one);
    topScores.insert(five);
    expect(topScores.getTopScores()).toEqual([one, two, three]);
  });
  it('getTopScores() uses Score.value as a tiebreaker', () => {
    const scores = [{
      score: 1,
      value: 'Cat'
    }, {
      score: 1,
      value: 'apple'
    }, {
      score: 1,
      value: 'Apple'
    }, {
      score: 1,
      value: ''
    }, {
      score: 2,
      value: 'Z'
    }, {
      score: 3,
      value: 'ball'
    }, {
      score: 1,
      value: 'cAt'
    }, {
      score: 1,
      value: 'cat'
    }, {
      score: 1,
      value: 'CAT'
    }];
    const topScores = new (_TopScores().default)(scores.length);
    scores.forEach(score => topScores.insert(score));
    expect(topScores.getTopScores().map(score => score.value)).toEqual(['cat', 'cAt', 'Cat', 'CAT', 'apple', 'Apple', '', 'Z', 'ball']);
  });
  it('.getSize() returns the size of the heap', () => {
    const topScores = new (_TopScores().default)(3);
    expect(topScores.getSize()).toEqual(0);
    const one = {
      score: 1,
      value: 'one'
    };
    const two = {
      score: 2,
      value: 'two'
    };
    const three = {
      score: 3,
      value: 'three'
    };
    const four = {
      score: 4,
      value: 'four'
    };
    const five = {
      score: 5,
      value: 'five'
    };
    topScores.insert(five);
    expect(topScores.getSize()).toEqual(1);
    topScores.insert(four);
    expect(topScores.getSize()).toEqual(2);
    topScores.insert(two);
    expect(topScores.getSize()).toEqual(3);
    topScores.insert(three);
    expect(topScores.getSize()).toEqual(3);
    topScores.insert(one);
    expect(topScores.getSize()).toEqual(3);
  });
});
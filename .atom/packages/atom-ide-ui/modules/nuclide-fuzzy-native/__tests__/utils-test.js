"use strict";

function _utils() {
  const data = require("../lib/utils");

  _utils = function () {
    return data;
  };

  return data;
}

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
describe('utils', () => {
  describe('scoreComparator', () => {
    it('returns >1 when the first score is greater', () => {
      expect((0, _utils().scoreComparator)({
        score: 2,
        value: ''
      }, {
        score: 1,
        value: ''
      })).toBeGreaterThan(0);
      expect((0, _utils().scoreComparator)({
        score: 2,
        value: 'A'
      }, {
        score: 2,
        value: 'a'
      })).toBeGreaterThan(0);
    });
    it('returns <1 when the second score is greater', () => {
      expect((0, _utils().scoreComparator)({
        score: 1,
        value: ''
      }, {
        score: 2,
        value: ''
      })).toBeLessThan(0);
      expect((0, _utils().scoreComparator)({
        score: 2,
        value: 'a'
      }, {
        score: 2,
        value: 'A'
      })).toBeLessThan(0);
    });
    it('returns 0 when the scores are equal', () => {
      expect((0, _utils().scoreComparator)({
        score: 1,
        value: ''
      }, {
        score: 1,
        value: ''
      })).toBe(0);
      expect((0, _utils().scoreComparator)({
        score: 2,
        value: 'A'
      }, {
        score: 2,
        value: 'A'
      })).toBe(0);
    });
  });
  describe('valueComparator', () => {
    it('alpha-sorts and breaks ties with capital letters first', () => {
      expect((0, _utils().valueComparator)('A', 'A')).toBe(0);
      expect((0, _utils().valueComparator)('a', 'a')).toBe(0);
      expect((0, _utils().valueComparator)('A', 'a')).toBeLessThan(0);
      expect((0, _utils().valueComparator)('a', 'A')).toBeGreaterThan(0);
    });
    it('shorter string sorts first', () => {
      expect((0, _utils().valueComparator)('Bb', 'Bba')).toBeLessThan(0);
      expect((0, _utils().valueComparator)('Bba', 'Bb')).toBeGreaterThan(0);
    });
    it('tiebreaker applied only for first non-matching character', () => {
      expect((0, _utils().valueComparator)('CAT', 'CaT')).toBeLessThan(0);
      expect((0, _utils().valueComparator)('CaT', 'CAT')).toBeGreaterThan(0);
    });
    it('behaves like localeCompare', () => {
      expect((0, _utils().valueComparator)('apple', 'CAT')).toBeLessThan(0);
      expect((0, _utils().valueComparator)('CAT', 'Cat')).toBeLessThan(0);
    });
  });
});
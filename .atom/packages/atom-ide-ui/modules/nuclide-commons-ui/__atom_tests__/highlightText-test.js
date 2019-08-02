"use strict";

function _highlightText() {
  const data = _interopRequireDefault(require("../highlightText"));

  _highlightText = function () {
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
 *  strict
 * @format
 */
describe('highlightText', () => {
  it('returns no ranges for no interpolated text', () => {
    expect(_highlightText().default`foo bar baz`).toEqual({
      text: 'foo bar baz',
      matchRanges: []
    });
  });
  it('returns ranges to highlight interpolated values', () => {
    expect(_highlightText().default`foo ${1 + 2} bar ${'baz'} baz`).toEqual({
      text: 'foo 3 bar baz baz',
      matchRanges: [[4, 5], [10, 13]]
    });
  });
  it("highlights the entire string if it's entirely interpolated", () => {
    expect(_highlightText().default`${'hello'}`).toEqual({
      text: 'hello',
      matchRanges: [[0, 5]]
    });
  });
  it('works with an interpolated value at the beginning', () => {
    expect(_highlightText().default`${1 + 2} bar ${'baz'} baz`).toEqual({
      text: '3 bar baz baz',
      matchRanges: [[0, 1], [6, 9]]
    });
  });
  it('works with an interpolated value at the end', () => {
    expect(_highlightText().default`foo ${1 + 2} bar ${'baz'}`).toEqual({
      text: 'foo 3 bar baz',
      matchRanges: [[4, 5], [10, 13]]
    });
  });
});
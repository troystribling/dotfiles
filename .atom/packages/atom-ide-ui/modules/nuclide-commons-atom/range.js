'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.





















wordAtPosition = wordAtPosition;exports.






































trimRange = trimRange;var _atom = require('atom');var _range;function _load_range() {return _range = require('../nuclide-commons/range');}var _textEditor;function _load_textEditor() {return _textEditor = require('./text-editor');} /**
                                                                                                                                                                                                                                        * Finds the word at the position. You can either provide a word regex yourself,
                                                                                                                                                                                                                                        * or have Atom use the word regex in force at the scopes at that position,
                                                                                                                                                                                                                                        * in which case it uses the optional includeNonWordCharacters, default true.
                                                                                                                                                                                                                                        * (I know that's a weird default but it follows Atom's convention...)
                                                                                                                                                                                                                                        */function wordAtPosition(editor, position, wordRegex) {let wordRegex_;if (wordRegex instanceof RegExp) {wordRegex_ = wordRegex;} else {// What is the word regex associated with the position? We'd like to use
    // atom$Cursor.wordRegExp, except that function gets the regex associated
    // with the editor's current cursor while we want the regex associated with
    // the specific position. So we re-implement it ourselves...
    const nonWordChars = (0, (_textEditor || _load_textEditor()).getNonWordCharacters)(editor, position);const escaped = nonWordChars.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); // We copied this escaping regex from atom$Cursor.wordRegexp, rather than
    // using the library function 'escapeStringRegExp'. That's because the
    // library function doesn't escape the hyphen character and so is
    // unsuitable for use inside a range.
    let r = `^[\t ]*$|[^\\s${escaped}]+`;if (wordRegex == null || wordRegex.includeNonWordCharacters) {r += `|[${escaped}]+`;}wordRegex_ = new RegExp(r, 'g');}return (0, (_range || _load_range()).wordAtPositionFromBuffer)(editor.getBuffer(), position, wordRegex_);} /**
                                                                                                                                                                                                                                                                           * Gets the trimmed range from a given range, i.e. moves the start and end points
                                                                                                                                                                                                                                                                           * to the first and last non-whitespace characters (or specified regex)
                                                                                                                                                                                                                                                                           * within the range respectively.
                                                                                                                                                                                                                                                                           *
                                                                                                                                                                                                                                                                           * @param editor       the editor containing the range
                                                                                                                                                                                                                                                                           * @param rangeToTrim  the range to trim
                                                                                                                                                                                                                                                                           * @param stopRegex    stop trimming when the first match is found for this regex,
                                                                                                                                                                                                                                                                           *   defaults to first non-whitespace character
                                                                                                                                                                                                                                                                           * @return atom$Range  the trimmed range
                                                                                                                                                                                                                                                                           */ /**
                                                                                                                                                                                                                                                                               * Copyright (c) 2017-present, Facebook, Inc.
                                                                                                                                                                                                                                                                               * All rights reserved.
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               * This source code is licensed under the BSD-style license found in the
                                                                                                                                                                                                                                                                               * LICENSE file in the root directory of this source tree. An additional grant
                                                                                                                                                                                                                                                                               * of patent rights can be found in the PATENTS file in the same directory.
                                                                                                                                                                                                                                                                               *
                                                                                                                                                                                                                                                                               *  strict-local
                                                                                                                                                                                                                                                                               * @format
                                                                                                                                                                                                                                                                               */function trimRange(editor, rangeToTrim, stopRegex = /\S/) {const buffer = editor.getBuffer();let { start, end } = rangeToTrim;buffer.scanInRange(stopRegex, rangeToTrim, ({ range, stop }) => {start = range.start;stop();});buffer.backwardsScanInRange(stopRegex, rangeToTrim, ({ range, stop }) => {end = range.end;stop();});return new _atom.Range(start, end);}
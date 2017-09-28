'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scrollIntoView = scrollIntoView;
exports.scrollIntoViewIfNeeded = scrollIntoViewIfNeeded;
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

/* globals getComputedStyle */

/**
 * Use these functions instead of `Element::scrollIntoView()` and
 * `Element::scrollIntoViewIfNeeded()`!
 *
 * We've had a recurring issue in Nuclide (e.g. T20028138) where the UI would shift, leaving part of
 * the workspace element offscreen and a blank area in the window. This was caused by called to the
 * native `scrollIntoView()` and `scrollIntoViewIfNeeded()` which, according to the spec, has two
 * potentially surprising behaviors:
 *
 * 1. [It scrolls every scrollable ancestor (not just the closest)][1], where
 * 2. "scrollable" is [explicitly defined][2] to include elements with `overflow: hidden`
 *
 * This is surprising because `overflow: hidden` is typically used to make elements *not
 * scrollable*.
 *
 * Once the `overflow: hidden` element is scrolled, the user has no way to return it to its original
 * position (as it has no scrollbars).
 *
 * Note that this API doesn't support smooth scrolling. If that becomes necessary, we'll need to
 * come up with a better fix.
 *
 * It's tempting to assume that using `scrollIntoViewIfNeeded()` would fix this issue, however, if
 * the window is small enough so that no amount of scrolling the desired scrollable element would
 * ever reveal the element you're trying to, the browser will keep scrolling ancestors.
 *
 * [1]: https://drafts.csswg.org/cssom-view/#element-scrolling-members
 * [2]: https://drafts.csswg.org/cssom-view/#scrolling-box
 */

function scrollIntoView(el, alignToTop) {
  const scrollTops = getOverflowHiddenScrollTops(el);
  el.scrollIntoView(alignToTop); // eslint-disable-line rulesdir/dom-apis
  restoreScrollTops(scrollTops);
}

function scrollIntoViewIfNeeded(el, center) {
  const scrollTops = getOverflowHiddenScrollTops(el);
  // $FlowIgnore: This should be added to the element type.
  el.scrollIntoViewIfNeeded(center); // eslint-disable-line rulesdir/dom-apis
  restoreScrollTops(scrollTops);
}

function getOverflowHiddenScrollTops(el_) {
  let el = el_;
  const scrollTops = new Map();
  while (el != null) {
    if (getComputedStyle(el).overflow === 'hidden') {
      scrollTops.set(el, el.scrollTop);
    }
    el = el.parentElement;
  }
  return scrollTops;
}

function restoreScrollTops(scrollTops) {
  scrollTops.forEach((scrollTop, el) => {
    el.scrollTop = scrollTop;
  });
}
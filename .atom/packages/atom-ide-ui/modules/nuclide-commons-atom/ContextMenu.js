"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.showMenuForEvent = showMenuForEvent;
exports.default = void 0;

function _UniversalDisposable() {
  const data = _interopRequireDefault(require("../nuclide-commons/UniversalDisposable"));

  _UniversalDisposable = function () {
    return data;
  };

  return data;
}

var _electron = require("electron");

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

/**
 * This class represents a collection of context menu items that have been registered with Atom's
 * ContextMenuManager under a single CSS selector. These items are ordered based on the specified
 * priority with which they are added to this object. (The CSS selector is either specified
 * explicitly via the `cssSelector` property of the RootMenuOptions passed to the constructor, or
 * implicitly via the `parent` property of the SubmenuOptions passed to the constructor.)
 *
 * This is in contrast to Atom's ContextMenuManager, which relies on the specificity of the CSS
 * selector for a menu item to determine its precedence. The motivation behind this approach is to
 * provide a total order on menu item ordering rather than a partial order. As such, this class
 * serves as an adapter between the numeric priority model and ContextMenuManager's model.
 *
 * Note that this class also provides support for submenu items. This requires Atom 1.6 or later
 * because it relies on this fix: https://github.com/atom/atom/pull/10486.
 */
class ContextMenu {
  /**
   * List of items that have been added to this context menu in the order they were added.
   * Note that this list does not get sorted: only a filtered version of it does.
   * Further, this list is mutated heavily, but it is never reassigned.
   */

  /**
   * This is the Disposable that represents adding all of this object's menu items to Atom's own
   * ContextMenuManager. When a new item is added to this object, we must remove all of the items
   * that we previously added to the ContextMenuManager and then re-add them based on the new
   * ordering of priorities that results from the new item.
   */
  constructor(menuOptions) {
    this._menuOptions = menuOptions;
    this._items = [];
    this._needsSort = false;
    this._sort = this._sort.bind(this);
    this._disposable = null;
  }
  /**
   * @return true if this menu does not contain any items; otherwise, returns false. Note this will
   *   return true if it contains only empty submenu items.
   */


  isEmpty() {
    return this._items.length === 0;
  }
  /**
   * Adds the specified item to this contenxt menu.
   *
   * Items with lower priority values appear earlier in the context menu
   * (i.e., items appear in numerical order with respect to priority).
   *
   * @return object whose dispose() method can be used to remove the menu item from this object.
   */


  addItem(item, priority) {
    const value = {
      type: 'item',
      item,
      priority
    };
    return this._addItemToList(value);
  }
  /**
   * Adds the specified submenu to this contenxt menu.
   *
   * Items with lower priority values appear earlier in the context menu
   * (i.e., items appear in numerical order with respect to priority).
   *
   * @return object whose dispose() method can be used to remove the submenu from this object.
   */


  addSubmenu(contextMenu, priority) {
    const value = {
      type: 'menu',
      menu: contextMenu,
      priority
    };
    return this._addItemToList(value);
  }

  _addItemToList(value) {
    this._items.push(value);

    this._needsSort = true;
    process.nextTick(this._sort); // TODO(mbolin): Ideally, this Disposable should be garbage-collected if this ContextMenu is
    // disposed.

    return new (_UniversalDisposable().default)(() => {
      const index = this._items.indexOf(value);

      this._items.splice(index, 1); // We need to invoke _sort for the management of this._disposable and atom.contextMenu.add.


      this._needsSort = true;

      this._sort();
    });
  }
  /**
   * This method must be invoked after this._items has been modified. If necessary, it will remove
   * all items that this object previously registered with Atom's ContextMenuManager. Then it will
   * re-register everything in this._items once it has been sorted.
   */


  _sort() {
    if (!this._needsSort) {
      return;
    }

    this._needsSort = false;

    if (this._disposable != null) {
      this._disposable.dispose();
    }

    const menuOptions = this._menuOptions;

    if (menuOptions.type === 'root') {
      const items = this._sortAndFilterItems();

      this._disposable = atom.contextMenu.add({
        [menuOptions.cssSelector]: items.map(this._contextMenuItemForInternalItem, this)
      });
    } else if (menuOptions.type === 'submenu') {
      // Tell the parent menu to sort itself.
      menuOptions.parent._needsSort = true;

      menuOptions.parent._sort();
    }
  }
  /** Translates this object's internal representation of a menu item to Atom's representation. */


  _contextMenuItemForInternalItem(internalItem) {
    if (internalItem.type === 'item') {
      return internalItem.item;
    } else if (internalItem.type === 'menu') {
      // Note that due to our own strict renaming rules, this must be a private method instead of a
      // static function because of the access to _menuOptions and _items.
      const menuOptions = internalItem.menu._menuOptions;

      if (!(menuOptions.type === 'submenu')) {
        throw new Error("Invariant violation: \"menuOptions.type === 'submenu'\"");
      }

      const items = internalItem.menu._sortAndFilterItems();

      return {
        label: menuOptions.label,
        submenu: items.map(this._contextMenuItemForInternalItem, this),
        shouldDisplay: menuOptions.shouldDisplay
      };
    } else {
      if (!false) {
        throw new Error("Invariant violation: \"false\"");
      }
    }
  }

  _sortAndFilterItems() {
    const items = this._items.filter(item => {
      if (item.type === 'item') {
        return true;
      } else if (item.type === 'menu') {
        const contextMenu = item.menu;
        return !contextMenu.isEmpty();
      }
    });

    items.sort(compareInternalItems);
    return items;
  }
  /** Removes all items this object has added to Atom's ContextMenuManager. */


  dispose() {
    this._needsSort = false;

    if (this._disposable != null) {
      this._disposable.dispose();
    }

    this._items.length = 0;
  }

  static isEventFromContextMenu(event) {
    // Context menu commands contain a specific `detail` parameter:
    // https://github.com/atom/atom/blob/v1.15.0/src/main-process/context-menu.coffee#L17
    return (// $FlowFixMe(>=0.68.0) Flow suppress (T27187857)
      Array.isArray(event.detail) && // flowlint-next-line sketchy-null-mixed:off
      event.detail[0] && event.detail[0].contextCommand
    );
  }

}
/** Comparator used to sort menu items by priority: lower priorities appear earlier. */


exports.default = ContextMenu;

function compareInternalItems(a, b) {
  return a.priority - b.priority;
}
/**
 * Shows the provided menu template. This will result in [an extra call to `templateForEvent()`][1],
 * but it means that we still go through `showMenuForEvent()`, maintaining its behavior wrt
 * (a)synchronousness. See atom/atom#13398.
 *
 * [1]: https://github.com/atom/atom/blob/v1.13.0/src/context-menu-manager.coffee#L200
 */


function showMenuForEvent(event, menuTemplate) {
  if (!(_electron.remote != null)) {
    throw new Error("Invariant violation: \"remote != null\"");
  }

  const win = _electron.remote.getCurrentWindow();

  const originalEmit = win.emit;

  const restore = () => {
    win.emit = originalEmit;
  };

  win.emit = (eventType, ...args) => {
    if (eventType !== 'context-menu') {
      return originalEmit(eventType, ...args);
    }

    const result = originalEmit('context-menu', menuTemplate);
    restore();
    return result;
  };

  atom.contextMenu.showForEvent(event);
  return new (_UniversalDisposable().default)(restore);
}
"use strict";

function _collection() {
  const data = require("../collection");

  _collection = function () {
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
 * 
 * @format
 */
describe('ensureArray', () => {
  it('works on arrays', () => {
    expect((0, _collection().ensureArray)([1])).toEqual([1]);
    expect((0, _collection().ensureArray)(['test'])).toEqual(['test']);
  });
  it('works on non-arrays', () => {
    expect((0, _collection().ensureArray)(1)).toEqual([1]);
    expect((0, _collection().ensureArray)('test')).toEqual(['test']);
  });
});
describe('arrayRemove', () => {
  let a;
  let empty;
  let single;
  beforeEach(() => {
    a = ['a', 'b', 'c'];
    empty = [];
    single = ['x'];
  });
  it('removes an element properly', () => {
    (0, _collection().arrayRemove)(a, 'b');
    expect(a).toEqual(['a', 'c']);
  });
  it('removes the first element properly', () => {
    (0, _collection().arrayRemove)(a, 'a');
    expect(a).toEqual(['b', 'c']);
  });
  it('removes the last element properly', () => {
    (0, _collection().arrayRemove)(a, 'c');
    expect(a).toEqual(['a', 'b']);
  });
  it('does nothing if the element is not found', () => {
    (0, _collection().arrayRemove)(a, 'd');
    expect(a).toEqual(['a', 'b', 'c']);
  });
  it('does nothing to an empty array', () => {
    (0, _collection().arrayRemove)(empty, 'a');
    expect(empty).toEqual([]);
  });
  it('works when there is a single element', () => {
    (0, _collection().arrayRemove)(single, 'x');
    expect(single).toEqual([]);
  });
});
describe('arrayEqual', () => {
  it('checks boolean elements', () => {
    expect((0, _collection().arrayEqual)([true, false, true], [true, false, true])).toBe(true);
    expect((0, _collection().arrayEqual)([true], [false])).toBe(false);
  });
  it('checks number elements', () => {
    expect((0, _collection().arrayEqual)([1, 2, 3], [1, 2, 3])).toBe(true);
    expect((0, _collection().arrayEqual)([1, 5, 3], [1, 2, 3])).toBe(false);
  });
  it('checks object elements', () => {
    expect((0, _collection().arrayEqual)([{}], [{}])).toBe(false);
    expect((0, _collection().arrayEqual)([{
      x: 1
    }, {
      x: 2
    }], [{
      x: 1
    }, {
      x: 2
    }], (a, b) => a.x === b.x)).toBe(true);
  });
  it('works with arrays of different lengths', () => {
    expect((0, _collection().arrayEqual)([1, 2], [1, 2, 3])).toBe(false);
    expect((0, _collection().arrayEqual)([1, 2, 3], [1, 2])).toBe(false);
  });
  it("doesn't call the compare function if the same array is used", () => {
    const compare = jest.fn().mockReturnValue(true);
    const a = [1, 2, 3];
    (0, _collection().arrayEqual)(a, a, compare);
    expect(compare).not.toHaveBeenCalled();
  });
});
describe('arrayCompact', () => {
  it('filters out null and undefined elements', () => {
    expect((0, _collection().arrayCompact)([0, false, '', [], null, undefined])).toEqual([0, false, '', []]);
  });
});
describe('arrayFindLastIndex', () => {
  it('returns the last matching index', () => {
    expect((0, _collection().arrayFindLastIndex)([1, 1, 2], x => x === 1)).toBe(1);
  });
  it('returns -1 if no match is found', () => {
    expect((0, _collection().arrayFindLastIndex)([1, 1, 2], x => x === 0)).toBe(-1);
  });
});
describe('mapUnion', () => {
  it('merges two unique maps', () => {
    const map1 = new Map([['key1', 'value1'], ['key2', 'value2']]);
    const map2 = new Map([['key3', 'value3'], ['key4', 'value4']]);
    const result = (0, _collection().mapUnion)(map1, map2);
    expect(result.size).toBe(4);
    expect(result.get('key1')).toBe('value1');
    expect(result.get('key2')).toBe('value2');
    expect(result.get('key3')).toBe('value3');
    expect(result.get('key4')).toBe('value4');
  });
  it('overrodes with the values of the latest maps', () => {
    const map1 = new Map([['commonKey', 'value1'], ['key2', 'value2']]);
    const map2 = new Map([['commonKey', 'value3'], ['key4', 'value4']]);
    const result = (0, _collection().mapUnion)(...[map1, map2]);
    expect(result.size).toBe(3);
    expect(result.get('commonKey')).toBe('value3');
    expect(result.get('key2')).toBe('value2');
    expect(result.get('key4')).toBe('value4');
  });
});
describe('isEmpty', () => {
  it('correctly identifies empty Objects', () => {
    expect((0, _collection().isEmpty)({})).toEqual(true);
  });
  it('correctly identifies non-empty Objects', () => {
    const proto = {
      a: 1,
      b: 2,
      c: 3
    };
    const objWithOwnProperties = Object.create(proto, {
      foo: {
        value: 'bar'
      }
    });
    const objWithoutOwnProperties = Object.create(proto);
    expect((0, _collection().isEmpty)({
      a: 1
    })).toEqual(false);
    expect((0, _collection().isEmpty)(objWithOwnProperties)).toEqual(false);
    expect((0, _collection().isEmpty)(objWithoutOwnProperties)).toEqual(false);
  });
});
describe('isIterable', () => {
  it('detects arrays are iterable', () => {
    expect((0, _collection().isIterable)(['foo', 'bar'])).toBe(true);
  });
  it('detects strings are iterable', () => {
    expect((0, _collection().isIterable)('foo')).toBe(true);
  });
  it('detects Sets are iterable', () => {
    expect((0, _collection().isIterable)(new Set(['foo', 'bar']))).toBe(true);
  });
  it('detects iterable objects are iterable', () => {
    const anIterable = {
      *[Symbol.iterator]() {
        yield 1;
        yield 42;
      }

    };
    expect((0, _collection().isIterable)(anIterable)).toBe(true);
  });
  it('detects plain objects are not iterable', () => {
    expect((0, _collection().isIterable)({
      foo: 'bar',
      baz: 42
    })).toBe(false);
  });
  it('detects numbers are not iterable', () => {
    expect((0, _collection().isIterable)(42)).toBe(false);
  });
});
describe('keyMirror', () => {
  it('correctly mirrors objects', () => {
    expect((0, _collection().keyMirror)({
      a: null,
      b: null
    })).toEqual({
      a: 'a',
      b: 'b'
    });
  });
});
describe('setFilter', () => {
  it('filters', () => {
    const set = new Set(['foo', 'bar', 'baz']);
    const filtered = (0, _collection().setFilter)(set, x => x.startsWith('b'));
    expect(filtered.size).toBe(2);
    expect(filtered.has('bar')).toBe(true);
    expect(filtered.has('baz')).toBe(true);
    expect(filtered.has('foo')).toBe(false);
  });
});
describe('setIntersect', () => {
  it('intersects', () => {
    const set1 = new Set(['foo', 'bar', 'baz']);
    const set2 = new Set(['fool', 'bar', 'bazl']);
    const result = (0, _collection().setIntersect)(set1, set2);
    expect(result.size).toBe(1);
    expect(result.has('bar')).toBe(true);
  });
});
describe('setUnion', () => {
  it('unions', () => {
    const set1 = new Set(['foo', 'bar', 'baz']);
    const set2 = new Set(['fool', 'bar', 'bazl']);
    const result = (0, _collection().setUnion)(set1, set2);
    const expected = new Set(['foo', 'bar', 'baz', 'fool', 'bazl']);
    expect((0, _collection().areSetsEqual)(result, expected)).toBe(true);
  });
});
describe('collect', () => {
  it('collects key-value pairs into a Map of arrays', () => {
    const pairs = [['neither', 1], ['neither', 2], ['fizz', 3], ['neither', 4], ['buzz', 5], ['fizz', 6], ['neither', 7], ['neither', 8], ['fizz', 9]];
    const result = (0, _collection().collect)(pairs);
    expect(result.size).toBe(3);
    expect(result.get('fizz')).toEqual([3, 6, 9]);
    expect(result.get('buzz')).toEqual([5]);
    expect(result.get('neither')).toEqual([1, 2, 4, 7, 8]);
  });
});
describe('DefaultMap', () => {
  it('calls the factory each time you get a nonexistant key', () => {
    const spy = jest.fn().mockReturnValue('default');
    const map = new (_collection().DefaultMap)(spy);
    expect(map.size).toBe(0);
    expect(map.get('a')).toBe('default');
    expect(map.get('b')).toBe('default');
    expect(map.size).toBe(2);
    expect(spy.mock.calls).toHaveLength(2);
  });
  it('can be cleared', () => {
    const map = new (_collection().DefaultMap)(() => 'default');
    map.get('a');
    map.get('b');
    map.clear();
    expect(map.size).toBe(0);
  });
  it('can update default values', () => {
    const map = new (_collection().DefaultMap)(() => 'default');
    expect(map.get('a')).toBe('default');
    map.set('a', 'custom');
    expect(map.get('a')).toBe('custom');
  });
  it('can be iterated', () => {
    const map = new (_collection().DefaultMap)(() => 'default');
    map.get('a');
    map.get('b');
    expect([...map.keys()]).toEqual(['a', 'b']);
    expect([...map.entries()]).toEqual([['a', 'default'], ['b', 'default']]);
  });
  it('takes initial values', () => {
    const map = new (_collection().DefaultMap)(() => 0, [['a', 1], ['b', 2]]);
    map.get('c');
    expect([...map.entries()]).toEqual([['a', 1], ['b', 2], ['c', 0]]);
    expect(map.size).toBe(3);
  });
});
describe('MultiMap', () => {
  let multimap = null;
  beforeEach(() => {
    multimap = new (_collection().MultiMap)();
  });
  afterEach(() => {
    // check representation invariants
    let size = 0;

    for (const [, set] of multimap._map) {
      expect(set.size).toBeGreaterThan(0);
      size += set.size;
    }

    expect(multimap.size).toEqual(size);
  });
  it("returns an empty set when a binding doesn't exist", () => {
    expect(multimap.get(4)).toEqual(new Set());
  });
  it('returns itself from add', () => {
    expect(multimap.add(1, 2)).toBe(multimap);
  });
  it('properly adds a single binding', () => {
    multimap.add(1, 2);
    expect(multimap.size).toEqual(1);
    expect(multimap.get(1)).toEqual(new Set([2]));
  });
  it('properly adds multiple bindings', () => {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    expect(multimap.size).toEqual(3);
    expect(multimap.get(1)).toEqual(new Set([2, 3]));
    expect(multimap.get(10)).toEqual(new Set([11]));
  });
  it('returns false from delete when nothing was deleted', () => {
    multimap.add(1, 2);
    expect(multimap.delete(1, 3)).toBe(false);
    expect(multimap.delete(2, 3)).toBe(false);
  });
  it('properly deletes a single binding', () => {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    expect(multimap.delete(1, 2)).toBe(true);
    expect(multimap.get(1)).toEqual(new Set([3]));
    expect(multimap.get(10)).toEqual(new Set([11]));
    expect(multimap.size).toEqual(2);
  });
  it('returns false from deleteAll when nothing was deleted', () => {
    expect(multimap.deleteAll(5)).toBe(false);
  });
  it('properly deletes all bindings for a given key', () => {
    multimap.add(1, 2).add(1, 3);
    expect(multimap.deleteAll(1)).toBe(true);
    expect(multimap.size).toEqual(0);
    expect(multimap.get(1)).toEqual(new Set());
  });
  it('properly clears', () => {
    multimap.add(1, 2).add(1, 3).add(10, 11);
    multimap.clear();
    expect(multimap.size).toEqual(0);
    expect(multimap.get(1)).toEqual(new Set());
    expect(multimap.get(10)).toEqual(new Set());
  });
  it('checks membership with has', () => {
    multimap.add(1, 2);
    expect(multimap.has(5, 6)).toBe(false);
    expect(multimap.has(1, 2)).toBe(true);
    expect(multimap.has(1, 3)).toBe(false);
  });
  it('checks membership with hasAny', () => {
    multimap.add(1, 2);
    expect(multimap.hasAny(1)).toBe(true);
    expect(multimap.hasAny(2)).toBe(false);
  });
});
describe('objectValues', () => {
  it('returns the values of an object', () => {
    expect((0, _collection().objectValues)({
      a: 1,
      b: 2,
      c: 4
    })).toEqual([1, 2, 4]);
  });
  it('throws for null', () => {
    expect(() => (0, _collection().objectEntries)(null)).toThrow();
  });
  it('throws for undefined', () => {
    expect(() => (0, _collection().objectEntries)(undefined)).toThrow();
  });
});
describe('objectEntries', () => {
  it('gets the entries of an object', () => {
    expect((0, _collection().objectEntries)({
      a: 1,
      b: 2
    })).toEqual([['a', 1], ['b', 2]]);
  });
  it('errors for null', () => {
    expect(() => (0, _collection().objectEntries)(null)).toThrow();
  });
  it('errors for undefined', () => {
    expect(() => (0, _collection().objectEntries)(null)).toThrow();
  });
  it('only includes own properties', () => {
    const a = {
      a: 1
    };
    const b = {
      b: 2
    };
    Object.setPrototypeOf(b, a);
    expect((0, _collection().objectEntries)(b)).toEqual([['b', 2]]);
  });
});
describe('objectFromMap', () => {
  it('converts a map to an object', () => {
    expect((0, _collection().objectFromMap)(new Map([['a', 1], ['b', 2]]))).toEqual({
      a: 1,
      b: 2
    });
  });
});
describe('concatIterators', () => {
  it('concatenates different iterable stuff to a single iterator', () => {
    expect(Array.from((0, _collection().concatIterators)(new Set([1, 2, 3]), [4, 5, 6], new Set([7, 8, 9]).values()))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
describe('areSetsEqual', () => {
  it('correctly compares empty sets', () => {
    expect((0, _collection().areSetsEqual)(new Set(), new Set())).toBe(true);
  });
  it('correctly compares sets with the same properties', () => {
    expect((0, _collection().areSetsEqual)(new Set(['foo']), new Set(['foo']))).toBe(true);
  });
  it('returns false when properties are not equal', () => {
    expect((0, _collection().areSetsEqual)(new Set(['foo']), new Set(['bar']))).toBe(false);
  });
  it('returns false when an item exists in one set but not the other', () => {
    expect((0, _collection().areSetsEqual)(new Set(['foo']), new Set())).toBe(false);
    expect((0, _collection().areSetsEqual)(new Set(), new Set(['foo']))).toBe(false);
  });
});
describe('someOfIterable', () => {
  it('lazily returns whether any element of an iterable fulfills a given predicate', () => {
    expect((0, _collection().someOfIterable)(new Set([1, 2, 3, 4, 5]), element => element % 2 === 0)).toEqual(true);
    expect((0, _collection().someOfIterable)(new Set([1, 2, 3, 4, 5]), element => element % 5 === 0)).toEqual(true);
    expect((0, _collection().someOfIterable)(new Set([1, 2, 3, 4, 5]), element => element % 6 === 0)).toEqual(false);
    expect((0, _collection().someOfIterable)([], element => true)).toEqual(false);
  });
});
describe('findInIterable', () => {
  it('return the first element of an iterable which fulfills a given predicate', () => {
    expect((0, _collection().findInIterable)(new Set([1, 2, 3, 4, 5]), element => element % 2 === 0)).toEqual(2);
    expect((0, _collection().findInIterable)(new Set([1, 2, 3, 4, 5]), element => element % 5 === 0)).toEqual(5);
    expect((0, _collection().findInIterable)(new Set([1, 2, 3, 4, 5]), element => element % 6 === 0)).toEqual(null);
    expect((0, _collection().findInIterable)([], element => true)).toEqual(null);
  });
});
describe('filterIterable', () => {
  it('returns a (lazy) iterable containing all elements which fulfill the given predicate', () => {
    expect(Array.from((0, _collection().filterIterable)(new Set([1, 2, 3, 4, 5]), element => element % 2 === 0))).toEqual([2, 4]);
    expect(Array.from((0, _collection().filterIterable)(new Set([1, 2, 3, 4, 5]), element => true))).toEqual([1, 2, 3, 4, 5]);
    expect(Array.from((0, _collection().filterIterable)(new Set([1, 2, 3, 4, 5]), element => false))).toEqual([]);
    expect(Array.from((0, _collection().filterIterable)([], element => true))).toEqual([]);
  });
});
describe('takeIterable', () => {
  it('returns a (lazy) iterable containing the first n elements', () => {
    expect(Array.from((0, _collection().takeIterable)(new Set([1, 2, 3, 4, 5]), 3)).length).toEqual(3);
    expect(Array.from((0, _collection().takeIterable)([1, 2, 3], 0)).length).toEqual(0);
    expect(Array.from((0, _collection().takeIterable)([1, 2, 3], 1)).length).toEqual(1);
    expect(Array.from((0, _collection().takeIterable)([1, 2, 3], 2)).length).toEqual(2);
    expect(Array.from((0, _collection().takeIterable)([1, 2, 3], 3)).length).toEqual(3);
    expect(Array.from((0, _collection().takeIterable)([1, 2, 3], 4)).length).toEqual(3);
  });
});
describe('mapEqual', () => {
  it('checks primary elements', () => {
    expect((0, _collection().mapEqual)(new Map([[1, true], [2, false], [5, true]]), new Map([[1, true], [2, false], [5, true]]))).toBe(true);
    expect((0, _collection().mapEqual)(new Map([[1, true]]), new Map([[1, false]]))).toBe(false);
    expect((0, _collection().mapEqual)(new Map([[1, true]]), new Map([]))).toBe(false);
    expect((0, _collection().mapEqual)(new Map([[1, true]]), new Map([[2, false]]))).toBe(false);
  });
  it('checks object value elements', () => {
    expect((0, _collection().mapEqual)(new Map([[1, {
      x: 1
    }]]), new Map([[1, {
      x: 1
    }]]))).toBe(false);
    expect((0, _collection().mapEqual)(new Map([[1, {
      x: 1
    }]]), new Map([[1, {
      x: 1
    }]]), (v1, v2) => v1.x === v2.x)).toBe(true);
  });
});
describe('mapIterable', () => {
  it('projects each element of an iterable into a new iterable', () => {
    expect(Array.from((0, _collection().mapIterable)(new Set(), element => true))).toEqual([]);
    expect(Array.from((0, _collection().mapIterable)(new Set([1, 2, 3, 4, 5]), element => element * element))).toEqual([1, 4, 9, 16, 25]);
  });
});
describe('mapGetWithDefault', () => {
  it('normally returns whatever is in the map', () => {
    expect((0, _collection().mapGetWithDefault)(new Map([[1, 2]]), 1, 3)).toBe(2);
  });
  it('returns the default if the key is not in the map', () => {
    expect((0, _collection().mapGetWithDefault)(new Map([[1, 2]]), 5, 3)).toBe(3);
  });
  it('returns `null` or `undefined` if they are values in the map', () => {
    expect((0, _collection().mapGetWithDefault)(new Map([[1, null]]), 1, 3)).toBeNull();
    expect((0, _collection().mapGetWithDefault)(new Map([[1, undefined]]), 1, 3)).toBeUndefined();
  });
});
describe('count', () => {
  it('returns how many values are in an iterable', () => {
    expect((0, _collection().count)([1, 2])).toBe(2);
  });
});
describe('insideOut', () => {
  it('traverses correctly', () => {
    expect([...(0, _collection().insideOut)([])]).toEqual([]);
    expect([...(0, _collection().insideOut)(['a'])]).toEqual([['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b'])]).toEqual([['b', 1], ['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c'])]).toEqual([['b', 1], ['a', 0], ['c', 2]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c', 'd'])]).toEqual([['c', 2], ['b', 1], ['d', 3], ['a', 0]]);
  });
  it('traverses correctly with an index', () => {
    expect([...(0, _collection().insideOut)([], 99)]).toEqual([]);
    expect([...(0, _collection().insideOut)(['a'], 99)]).toEqual([['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b'], 99)]).toEqual([['b', 1], ['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c'], 99)]).toEqual([['c', 2], ['b', 1], ['a', 0]]);
    expect([...(0, _collection().insideOut)([], -99)]).toEqual([]);
    expect([...(0, _collection().insideOut)(['a'], -99)]).toEqual([['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b'], -99)]).toEqual([['a', 0], ['b', 1]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c'], -99)]).toEqual([['a', 0], ['b', 1], ['c', 2]]);
    expect([...(0, _collection().insideOut)(['a', 'b'], 1)]).toEqual([['b', 1], ['a', 0]]);
    expect([...(0, _collection().insideOut)(['a', 'b'], 0)]).toEqual([['a', 0], ['b', 1]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c'], 1)]).toEqual([['b', 1], ['a', 0], ['c', 2]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c', 'd'], 1)]).toEqual([['b', 1], ['a', 0], ['c', 2], ['d', 3]]);
    expect([...(0, _collection().insideOut)(['a', 'b', 'c', 'd'], 2)]).toEqual([['c', 2], ['b', 1], ['d', 3], ['a', 0]]);
  });
});
describe('range', () => {
  it('includes the start value, but not the stop value', () => {
    expect([...(0, _collection().range)(1, 4)]).toEqual([1, 2, 3]);
  });
  it('is empty if stop is less than, or equal to, start', () => {
    expect([...(0, _collection().range)(2, 1)]).toEqual([]);
    expect([...(0, _collection().range)(1, 1)]).toEqual([]);
  });
});
describe('objectFromPairs', () => {
  it('creates an object with the keys and values of the iterable', () => {
    function* gen() {
      yield ['a', 1];
      yield ['b', 2];
    }

    expect((0, _collection().objectFromPairs)(gen())).toEqual({
      a: 1,
      b: 2
    });
  });
});
describe('objectMapValues', () => {
  it('maps values', () => {
    const mapped = (0, _collection().objectMapValues)({
      a: 1,
      b: 2
    }, v => v + 1);
    expect(mapped).toEqual({
      a: 2,
      b: 3
    });
  });
  it('can project keys too', () => {
    const mapped = (0, _collection().objectMapValues)({
      a: 1,
      b: 2
    }, (v, k) => k);
    expect(mapped).toEqual({
      a: 'a',
      b: 'b'
    });
  });
});
describe('mapFromObject', () => {
  it('converts a object to an map', () => {
    expect((0, _collection().mapEqual)((0, _collection().mapFromObject)({
      a: 1,
      b: 2
    }), new Map([['a', 1], ['b', 2]]))).toEqual(true);
  });
});
describe('distinct', () => {
  it('returns the unique values mapped (or keys)', () => {
    expect((0, _collection().distinct)([1, 2, 3])).toEqual([1, 2, 3]);
    expect((0, _collection().distinct)(['1', '2', '3'])).toEqual(['1', '2', '3']);
    expect((0, _collection().distinct)([1, 2, 3, 4], x => String(x % 2 === 0))).toEqual([1, 2]);
    expect((0, _collection().distinct)([{
      x: 1
    }, {
      x: 2
    }, {
      x: 3
    }, {
      x: 4
    }, {
      x: 4
    }], o => String(o.x))).toEqual([{
      x: 1
    }, {
      x: 2
    }, {
      x: 3
    }, {
      x: 4
    }]);
  });
});
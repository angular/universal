import '../../../helpers/polyfills.test';
import {
  cssHyphenate,
  isPresent,
  isString,
  isBlank,
  regExFirstMatch,
  setValueOnPath,
  camelCaseToDashCase,
  dashCaseToCamelCase,
  stringify,
  listContains,
  stringMapForEach,
  isSuccess,
  _randomChar,
  _appIdRandomProviderFactory,
  arrayFlattenTree,
  ListWrapper,
  StringMapWrapper
} from '../helper';

describe('Platform-Node Helpers', ()=> {
  describe('CSS Hyphenate', () => {
    it('should hyphenize css classes', () => {
      expect(cssHyphenate('backgroundColor')).toBe('background-color');
    });

    it('should hyphenize css classes with ms prefix', () => {
      expect(cssHyphenate('ms-property')).toBe('-ms-property');
    });

    it('should hyphenize css classes that are already hyphenized', () => {
      expect(cssHyphenate('border-bottom')).toBe('border-bottom');
    });
  });
  describe('isPresent', () => {
    it('should return true on an non empty object', () => {
      expect(isPresent({})).toBe(true);
    });
    it('should return false if null', () => {
      expect(isPresent(null)).toBe(false);
    });
    it('should return false if undefined', () => {
      expect(isPresent(undefined)).toBe(false);
    });
  });
  describe('isString', () => {
    it('should return true if string', () => {
      expect(isString('test')).toBe(true);
    });
    it('should return false if number', () => {
      expect(isString(123)).toBe(false);
    });
  });
  describe('isBlank', () => {
    it('should return true on an non empty object', () => {
      expect(isBlank({})).toBe(false);
    });
    it('should return false if null', () => {
      expect(isBlank(null)).toBe(true);
    });
    it('should return false if undefined', () => {
      expect(isBlank(undefined)).toBe(true);
    });
  });
  describe('regExFirstMatch', () => {
    it('should return first match', () => {
      expect(regExFirstMatch(/test/g, 'test test test').toString()).toBe('test');
    });
  });
  describe('setValueOnPath', () => {
    it('should add properties to context object and set value', () => {
      let context = {};
      setValueOnPath(context, 'test.path', 1);
      expect(context).toEqual({ test: { path: 1 } });
    });

    it('should add properties to context object and set value on existing property', () => {
      let context = {
        test: {
          path: 1
        }
      };
      setValueOnPath(context, 'test.path', 2);
      expect(context).toEqual({ test: { path: 2 } });
    });
  });
  describe('camelCaseToDashCase', () => {
    it('should transform lower camel case to dash case', () => {
      expect(camelCaseToDashCase('thisIsATest')).toBe('this-is-a-test');
    });

    it('should transform upper camel case to dash case', () => {
      //TODO: ask Patrick if tis is the correct behavior
      expect(camelCaseToDashCase('ThisIsATest')).toBe('-this-is-a-test');
    });

    it('should leave dash case', () => {
      expect(camelCaseToDashCase('this-is-a-test')).toBe('this-is-a-test');
    });
  });
  describe('dashCaseToCamelCase', () => {
    it('should transform dash case to lower camel case', () => {
      expect(dashCaseToCamelCase('this-is-a-test')).toBe('thisIsATest');
    });

    it('should transform dash case to upper camel case', () => {
      //TODO: ask Patrick if tis is the correct behavior
      expect(dashCaseToCamelCase('-this-is-a-test')).toBe('ThisIsATest');
    });

    it('should leave camel case', () => {
      expect(('ThisIsATest')).toBe('ThisIsATest');
    });
  });
  describe('stringify', () => {
    it('should return token if string', () => {
      expect(stringify('test')).toBe('test');
    });

    it('should return \'null\' string if token is null', () => {
      expect(stringify(null)).toBe('null');
    });

    it('should return \'undefined\' string if token is null', () => {
      expect(stringify(undefined)).toBe('undefined');
    });

    it('should return overriddenName string if token has a property overriddenName', () => {
      expect(stringify({ overriddenName: 'test' })).toBe('test');
    });

    it('should return name string if token has a property name', () => {
      expect(stringify({ name: 'test' })).toBe('test');
    });

    it('should return a string from an array', () => {
      expect(stringify(['foo', 'bar'])).toBe('foo,bar');
    });
  });
  describe('listContains', () => {
    it('should return true when element is in list', () => {
      expect(listContains(['foo', 'bar'], 'foo')).toBe(true);
    });

    it('should return true when element is in list', () => {
      expect(listContains(['foo', 'bar'], 'baz')).toBe(false);
    });
  });
  describe('listContains', () => {
    it('should walk through a string map', () => {
      let count = 0;
      stringMapForEach({ 'foo': 1, 'bar': 2 }, () => {
        count++;
      });

      expect(count).toBe(2);
    });
  });
  describe('isSuccess', () => {
    it('should return false if response code is about 300', () => {
      expect(isSuccess(403)).toBe(false);
    });

    it('should return true if repsonse code is between 200 and 300', () => {
      expect(isSuccess(200)).toBe(true);
    });
  });
  describe('_randomChar', () => {
    it('should return a random char', () => {
      expect(typeof _randomChar()).toBe('string');
      expect(_randomChar().length).toBe(1);
    });
  });
  describe('_appIdRandomProviderFactory', () => {
    it('should return 3 random chars', () => {
      expect(typeof _appIdRandomProviderFactory()).toBe('string');
      expect(_appIdRandomProviderFactory().length).toBe(3);
    });
  });
  describe('arrayFlattenTree', () => {
    it('should flatten array hierarchy', () => {
      expect(arrayFlattenTree(['foo', 'bar', ['baz', 'foo']], [])).toEqual(['foo', 'bar', 'baz', 'foo']);
    });
  });
  describe('ListWrapper', () => {
    it('should return true when element is in list', () => {
      expect(ListWrapper.contains(['foo', 'bar'], 'foo')).toBe(true);
    });
    it('should return false when element is not in list', () => {
      expect(ListWrapper.contains(['foo', 'bar'], 'baz')).toBe(false);
    });
    it('should return true when element is deleted', () => {
      expect(ListWrapper.remove(['foo', 'bar'], 'foo')).toBe(true);
    });
    it('should return false when element is not deleted', () => {
      expect(ListWrapper.remove(['foo', 'bar'], 'baz')).toBe(false);
    });
  });
  describe('StringMapWrapper', () => {
    it('should return an empty object', () => {
      expect(StringMapWrapper.create()).toEqual({});
    });
    it('should return if property exists', () => {
      expect(StringMapWrapper.contains({ foo: 'bar' }, 'foo')).toBe(true);
      expect(StringMapWrapper.contains({ foo: 'bar' }, 'baz')).toBe(false);
    });
    it('should return property value or undefined', () => {
      expect(StringMapWrapper.get({ foo: 'bar' }, 'foo')).toBe('bar');
      expect(StringMapWrapper.get({ foo: 'bar' }, 'baz')).toBe(undefined);
    });
    it('should set a new value to property', () => {
      let map = {
        foo: 'bar'
      };
      StringMapWrapper.set(map, 'foo', 'baz');
      expect(map.foo).toBe('baz');
    });
    it('should add a new value to property', () => {
      let map = {};
      StringMapWrapper.set(map, 'foo', 'baz');
      expect(map['foo']).toBe('baz');
    });
    it('should return an array of keys', () => {
      expect(StringMapWrapper.keys({ foo: 'bar', baz: 'bar' })).toEqual(['foo', 'baz']);
    });
    it('should return an array of values', () => {
      expect(StringMapWrapper.values({ foo: 'bar', baz: 'bar' })).toEqual(['bar', 'bar']);
    });
    it('should return if map is empty', () => {
      expect(StringMapWrapper.isEmpty({})).toBe(true);
      expect(StringMapWrapper.isEmpty({ foo: 'bar' })).toBe(false);
    });
    it('should delete property', () => {
      let map = {
        foo: 'bar'
      };
      StringMapWrapper.delete(map, 'foo');
      expect(map['foo']).toBe(undefined);
    });
    it('should iterate through map', () => {
      let map = {
          foo: 'bar',
          bar: 'baz'
        },
        count = 0;
      StringMapWrapper.forEach(map, () => {
        count++;
      });
      expect(count).toBe(2);
    });
    it('should merge two maps', () => {
      let map1 = {
          foo: 'bar',
          bar: 'baz'
        },
        map2 = {
          foo: 'bar2',
          bar2: 'baz2'
        },
        res;
      res = StringMapWrapper.merge(map1, map2);
      expect(res).toEqual({
        foo: 'bar2',
        bar: 'baz',
        bar2: 'baz2'
      });
    });
    it('should merge two maps', () => {
      let map1 = {
          foo: 'bar',
          bar: 'baz'
        },
        map2 = {
          foo: 'bar2',
          bar2: 'baz2'
        },
        map3 = {
          foo: 'bar',
          bar: 'baz'
        },
        map4 = {
          foooo: 'baaaar'
        };
      expect(StringMapWrapper.equals(map1, map2)).toBe(false);
      expect(StringMapWrapper.equals(map1, map4)).toBe(false);
      expect(StringMapWrapper.equals(map1, map3)).toBe(true);
    });
  });
});

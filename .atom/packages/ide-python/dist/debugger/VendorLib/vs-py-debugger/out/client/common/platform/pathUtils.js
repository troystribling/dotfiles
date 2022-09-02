"use strict";

var __decorate = void 0 && (void 0).__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};

var __param = void 0 && (void 0).__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const inversify_1 = require("inversify");

const path = require("path");

const types_1 = require("../types");

const constants_1 = require("./constants"); // tslint:disable-next-line:no-var-requires no-require-imports


const untildify = require('untildify');

let PathUtils = class PathUtils {
  constructor(isWindows) {
    this.isWindows = isWindows;
    this.home = '';
    this.home = untildify('~');
  }

  get delimiter() {
    return path.delimiter;
  } // TO DO: Deprecate in favor of IPlatformService


  getPathVariableName() {
    return this.isWindows ? constants_1.WINDOWS_PATH_VARIABLE_NAME : constants_1.NON_WINDOWS_PATH_VARIABLE_NAME;
  }

  basename(pathValue, ext) {
    return path.basename(pathValue, ext);
  }

  getDisplayName(pathValue, cwd) {
    if (cwd && pathValue.startsWith(cwd)) {
      return `.${path.sep}${path.relative(cwd, pathValue)}`;
    } else if (pathValue.startsWith(this.home)) {
      return `~${path.sep}${path.relative(this.home, pathValue)}`;
    } else {
      return pathValue;
    }
  }

};
PathUtils = __decorate([inversify_1.injectable(), __param(0, inversify_1.inject(types_1.IsWindows))], PathUtils);
exports.PathUtils = PathUtils;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBhdGhVdGlscy5qcyJdLCJuYW1lcyI6WyJfX2RlY29yYXRlIiwiZGVjb3JhdG9ycyIsInRhcmdldCIsImtleSIsImRlc2MiLCJjIiwiYXJndW1lbnRzIiwibGVuZ3RoIiwiciIsIk9iamVjdCIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsImQiLCJSZWZsZWN0IiwiZGVjb3JhdGUiLCJpIiwiZGVmaW5lUHJvcGVydHkiLCJfX3BhcmFtIiwicGFyYW1JbmRleCIsImRlY29yYXRvciIsImV4cG9ydHMiLCJ2YWx1ZSIsImludmVyc2lmeV8xIiwicmVxdWlyZSIsInBhdGgiLCJ0eXBlc18xIiwiY29uc3RhbnRzXzEiLCJ1bnRpbGRpZnkiLCJQYXRoVXRpbHMiLCJjb25zdHJ1Y3RvciIsImlzV2luZG93cyIsImhvbWUiLCJkZWxpbWl0ZXIiLCJnZXRQYXRoVmFyaWFibGVOYW1lIiwiV0lORE9XU19QQVRIX1ZBUklBQkxFX05BTUUiLCJOT05fV0lORE9XU19QQVRIX1ZBUklBQkxFX05BTUUiLCJiYXNlbmFtZSIsInBhdGhWYWx1ZSIsImV4dCIsImdldERpc3BsYXlOYW1lIiwiY3dkIiwic3RhcnRzV2l0aCIsInNlcCIsInJlbGF0aXZlIiwiaW5qZWN0YWJsZSIsImluamVjdCIsIklzV2luZG93cyJdLCJtYXBwaW5ncyI6IkFBQUE7O0FBQ0EsSUFBSUEsVUFBVSxHQUFJLFVBQVEsU0FBS0EsVUFBZCxJQUE2QixVQUFVQyxVQUFWLEVBQXNCQyxNQUF0QixFQUE4QkMsR0FBOUIsRUFBbUNDLElBQW5DLEVBQXlDO0FBQ25GLE1BQUlDLENBQUMsR0FBR0MsU0FBUyxDQUFDQyxNQUFsQjtBQUFBLE1BQTBCQyxDQUFDLEdBQUdILENBQUMsR0FBRyxDQUFKLEdBQVFILE1BQVIsR0FBaUJFLElBQUksS0FBSyxJQUFULEdBQWdCQSxJQUFJLEdBQUdLLE1BQU0sQ0FBQ0Msd0JBQVAsQ0FBZ0NSLE1BQWhDLEVBQXdDQyxHQUF4QyxDQUF2QixHQUFzRUMsSUFBckg7QUFBQSxN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QUFwRDtBQUNILEtBRkQsTUFHSyxJQUFJQSxTQUFTLENBQUNJLFVBQVYsQ0FBcUIsS0FBS1YsSUFBMUIsQ0FBSixFQUFxQztBQUN0QyxhQUFRLElBQUdQLElBQUksQ0FBQ2tCLEdBQUksR0FBRWxCLElBQUksQ0FBQ21CLFFBQUwsQ0FBYyxLQUFLWixJQUFuQixFQUF5Qk0sU0FBekIsQ0FBb0MsRUFBMUQ7QUFDSCxLQUZJLE1BR0E7QUFDRCxhQUFPQSxTQUFQO0FBQ0g7QUFDSjs7QUExQjJCLENBQWhDO0FBNEJBVCxTQUFTLEdBQUczQixVQUFVLENBQUMsQ0FDbkJxQixXQUFXLENBQUNzQixVQUFaLEVBRG1CLEVBRW5CM0IsT0FBTyxDQUFDLENBQUQsRUFBSUssV0FBVyxDQUFDdUIsTUFBWixDQUFtQnBCLE9BQU8sQ0FBQ3FCLFNBQTNCLENBQUosQ0FGWSxDQUFELEVBR25CbEIsU0FIbUIsQ0FBdEI7QUFJQVIsT0FBTyxDQUFDUSxTQUFSLEdBQW9CQSxTQUFwQiIsInNvdXJjZXNDb250ZW50IjpbIlwidXNlIHN0cmljdFwiO1xudmFyIF9fZGVjb3JhdGUgPSAodGhpcyAmJiB0aGlzLl9fZGVjb3JhdGUpIHx8IGZ1bmN0aW9uIChkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYykge1xuICAgIHZhciBjID0gYXJndW1lbnRzLmxlbmd0aCwgciA9IGMgPCAzID8gdGFyZ2V0IDogZGVzYyA9PT0gbnVsbCA/IGRlc2MgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yKHRhcmdldCwga2V5KSA6IGRlc2MsIGQ7XG4gICAgaWYgKHR5cGVvZiBSZWZsZWN0ID09PSBcIm9iamVjdFwiICYmIHR5cGVvZiBSZWZsZWN0LmRlY29yYXRlID09PSBcImZ1bmN0aW9uXCIpIHIgPSBSZWZsZWN0LmRlY29yYXRlKGRlY29yYXRvcnMsIHRhcmdldCwga2V5LCBkZXNjKTtcbiAgICBlbHNlIGZvciAodmFyIGkgPSBkZWNvcmF0b3JzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBpZiAoZCA9IGRlY29yYXRvcnNbaV0pIHIgPSAoYyA8IDMgPyBkKHIpIDogYyA+IDMgPyBkKHRhcmdldCwga2V5LCByKSA6IGQodGFyZ2V0LCBrZXkpKSB8fCByO1xuICAgIHJldHVybiBjID4gMyAmJiByICYmIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh0YXJnZXQsIGtleSwgciksIHI7XG59O1xudmFyIF9fcGFyYW0gPSAodGhpcyAmJiB0aGlzLl9fcGFyYW0pIHx8IGZ1bmN0aW9uIChwYXJhbUluZGV4LCBkZWNvcmF0b3IpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHRhcmdldCwga2V5KSB7IGRlY29yYXRvcih0YXJnZXQsIGtleSwgcGFyYW1JbmRleCk7IH1cbn07XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBpbnZlcnNpZnlfMSA9IHJlcXVpcmUoXCJpbnZlcnNpZnlcIik7XG5jb25zdCBwYXRoID0gcmVxdWlyZShcInBhdGhcIik7XG5jb25zdCB0eXBlc18xID0gcmVxdWlyZShcIi4uL3R5cGVzXCIpO1xuY29uc3QgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG4vLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdmFyLXJlcXVpcmVzIG5vLXJlcXVpcmUtaW1wb3J0c1xuY29uc3QgdW50aWxkaWZ5ID0gcmVxdWlyZSgndW50aWxkaWZ5Jyk7XG5sZXQgUGF0aFV0aWxzID0gY2xhc3MgUGF0aFV0aWxzIHtcbiAgICBjb25zdHJ1Y3Rvcihpc1dpbmRvd3MpIHtcbiAgICAgICAgdGhpcy5pc1dpbmRvd3MgPSBpc1dpbmRvd3M7XG4gICAgICAgIHRoaXMuaG9tZSA9ICcnO1xuICAgICAgICB0aGlzLmhvbWUgPSB1bnRpbGRpZnkoJ34nKTtcbiAgICB9XG4gICAgZ2V0IGRlbGltaXRlcigpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguZGVsaW1pdGVyO1xuICAgIH1cbiAgICAvLyBUTyBETzogRGVwcmVjYXRlIGluIGZhdm9yIG9mIElQbGF0Zm9ybVNlcnZpY2VcbiAgICBnZXRQYXRoVmFyaWFibGVOYW1lKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5pc1dpbmRvd3MgPyBjb25zdGFudHNfMS5XSU5ET1dTX1BBVEhfVkFSSUFCTEVfTkFNRSA6IGNvbnN0YW50c18xLk5PTl9XSU5ET1dTX1BBVEhfVkFSSUFCTEVfTkFNRTtcbiAgICB9XG4gICAgYmFzZW5hbWUocGF0aFZhbHVlLCBleHQpIHtcbiAgICAgICAgcmV0dXJuIHBhdGguYmFzZW5hbWUocGF0aFZhbHVlLCBleHQpO1xuICAgIH1cbiAgICBnZXREaXNwbGF5TmFtZShwYXRoVmFsdWUsIGN3ZCkge1xuICAgICAgICBpZiAoY3dkICYmIHBhdGhWYWx1ZS5zdGFydHNXaXRoKGN3ZCkpIHtcbiAgICAgICAgICAgIHJldHVybiBgLiR7cGF0aC5zZXB9JHtwYXRoLnJlbGF0aXZlKGN3ZCwgcGF0aFZhbHVlKX1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHBhdGhWYWx1ZS5zdGFydHNXaXRoKHRoaXMuaG9tZSkpIHtcbiAgICAgICAgICAgIHJldHVybiBgfiR7cGF0aC5zZXB9JHtwYXRoLnJlbGF0aXZlKHRoaXMuaG9tZSwgcGF0aFZhbHVlKX1gO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHBhdGhWYWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5QYXRoVXRpbHMgPSBfX2RlY29yYXRlKFtcbiAgICBpbnZlcnNpZnlfMS5pbmplY3RhYmxlKCksXG4gICAgX19wYXJhbSgwLCBpbnZlcnNpZnlfMS5pbmplY3QodHlwZXNfMS5Jc1dpbmRvd3MpKVxuXSwgUGF0aFV0aWxzKTtcbmV4cG9ydHMuUGF0aFV0aWxzID0gUGF0aFV0aWxzO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9cGF0aFV0aWxzLmpzLm1hcCJdfQ==
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _RemoteControlService;

function _load_RemoteControlService() {
  return _RemoteControlService = require('./pkg/atom-ide-debugger/lib/RemoteControlService');
}

Object.defineProperty(exports, 'DebuggerService', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_RemoteControlService || _load_RemoteControlService()).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
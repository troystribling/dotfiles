// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const DebugClient_1 = require("./DebugClient");

const localDebugClientV2_1 = require("./localDebugClientV2");

class NonDebugClientV2 extends localDebugClientV2_1.LocalDebugClientV2 {
  constructor(args, debugSession, canLaunchTerminal, launcherScriptProvider) {
    super(args, debugSession, canLaunchTerminal, launcherScriptProvider);
  }

  get DebugType() {
    return DebugClient_1.DebugType.RunLocal;
  }

  Stop() {
    super.Stop();

    if (this.pyProc) {
      try {
        this.pyProc.kill(); // tslint:disable-next-line:no-empty
      } catch (_a) {}

      this.pyProc = undefined;
    }
  }

  handleProcessOutput(proc, _failedToLaunch) {// Do nothing
  }

}

exports.NonDebugClientV2 = NonDebugClientV2;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vbkRlYnVnQ2xpZW50VjIuanMiXSwibmFtZXMiOlsiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJleHBvcnRzIiwidmFsdWUiLCJEZWJ1Z0NsaWVudF8xIiwicmVxdWlyZSIsImxvY2FsRGVidWdDbGllbnRWMl8xIiwiTm9uRGVidWdDbGllbnRWMiIsIkxvY2FsRGVidWdDbGllbnRWMiIsImNvbnN0cnVjdG9yIiwiYXJncyIsImRlYnVnU2Vzc2lvbiIsImNhbkxhdW5jaFRlcm1pbmFsIiwibGF1bmNoZXJTY3JpcHRQcm92aWRlciIsIkRlYnVnVHlwZSIsIlJ1bkxvY2FsIiwiU3RvcCIsInB5UHJvYyIsImtpbGwiLCJfYSIsInVuZGVmaW5lZCIsImhhbmRsZVByb2Nlc3NPdXRwdXQiLCJwcm9jIiwiX2ZhaWxlZFRvTGF1bmNoIl0sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7O0FBQ0FBLE1BQU0sQ0FBQ0MsY0FBUCxDQUFzQkMsT0FBdEIsRUFBK0IsWUFBL0IsRUFBNkM7QUFBRUMsRUFBQUEsS0FBSyxFQUFFO0FBQVQsQ0FBN0M7O0FBQ0EsTUFBTUMsYUFBYSxHQUFHQyxPQUFPLENBQUMsZUFBRCxDQUE3Qjs7QUFDQSxNQUFNQyxvQkFBb0IsR0FBR0QsT0FBTyxDQUFDLHNCQUFELENBQXBDOztBQUNBLE1BQU1FLGdCQUFOLFNBQStCRCxvQkFBb0IsQ0FBQ0Usa0JBQXBELENBQXVFO0FBQ25FQyxFQUFBQSxXQUFXLENBQUNDLElBQUQsRUFBT0MsWUFBUCxFQUFxQkMsaUJBQXJCLEVBQXdDQyxzQkFBeEMsRUFBZ0U7QUFDdkUsVUFBTUgsSUFBTixFQUFZQyxZQUFaLEVBQTBCQyxpQkFBMUIsRUFBNkNDLHNCQUE3QztBQUNIOztBQUNZLE1BQVRDLFNBQVMsR0FBRztBQUNaLFdBQU9WLGFBQWEsQ0FBQ1UsU0FBZCxDQUF3QkMsUUFBL0I7QUFDSDs7QUFDREMsRUFBQUEsSUFBSSxHQUFHO0FBQ0gsVUFBTUEsSUFBTjs7QUFDQSxRQUFJLEtBQUtDLE1BQVQsRUFBaUI7QUFDYixVQUFJO0FBQ0EsYUFBS0EsTUFBTCxDQUFZQyxJQUFaLEdBREEsQ0FFQTtBQUNILE9BSEQsQ0FJQSxPQUFPQyxFQUFQLEVBQVcsQ0FBRzs7QUFDZCxXQUFLRixNQUFMLEdBQWNHLFNBQWQ7QUFDSDtBQUNKOztBQUNEQyxFQUFBQSxtQkFBbUIsQ0FBQ0MsSUFBRCxFQUFPQyxlQUFQLEVBQXdCLENBQ3ZDO0FBQ0g7O0FBcEJrRTs7QUFzQnZFckIsT0FBTyxDQUFDSyxnQkFBUixHQUEyQkEsZ0JBQTNCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4ndXNlIHN0cmljdCc7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCBEZWJ1Z0NsaWVudF8xID0gcmVxdWlyZShcIi4vRGVidWdDbGllbnRcIik7XG5jb25zdCBsb2NhbERlYnVnQ2xpZW50VjJfMSA9IHJlcXVpcmUoXCIuL2xvY2FsRGVidWdDbGllbnRWMlwiKTtcbmNsYXNzIE5vbkRlYnVnQ2xpZW50VjIgZXh0ZW5kcyBsb2NhbERlYnVnQ2xpZW50VjJfMS5Mb2NhbERlYnVnQ2xpZW50VjIge1xuICAgIGNvbnN0cnVjdG9yKGFyZ3MsIGRlYnVnU2Vzc2lvbiwgY2FuTGF1bmNoVGVybWluYWwsIGxhdW5jaGVyU2NyaXB0UHJvdmlkZXIpIHtcbiAgICAgICAgc3VwZXIoYXJncywgZGVidWdTZXNzaW9uLCBjYW5MYXVuY2hUZXJtaW5hbCwgbGF1bmNoZXJTY3JpcHRQcm92aWRlcik7XG4gICAgfVxuICAgIGdldCBEZWJ1Z1R5cGUoKSB7XG4gICAgICAgIHJldHVybiBEZWJ1Z0NsaWVudF8xLkRlYnVnVHlwZS5SdW5Mb2NhbDtcbiAgICB9XG4gICAgU3RvcCgpIHtcbiAgICAgICAgc3VwZXIuU3RvcCgpO1xuICAgICAgICBpZiAodGhpcy5weVByb2MpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgdGhpcy5weVByb2Mua2lsbCgpO1xuICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1lbXB0eVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKF9hKSB7IH1cbiAgICAgICAgICAgIHRoaXMucHlQcm9jID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgfVxuICAgIGhhbmRsZVByb2Nlc3NPdXRwdXQocHJvYywgX2ZhaWxlZFRvTGF1bmNoKSB7XG4gICAgICAgIC8vIERvIG5vdGhpbmdcbiAgICB9XG59XG5leHBvcnRzLk5vbkRlYnVnQ2xpZW50VjIgPSBOb25EZWJ1Z0NsaWVudFYyO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bm9uRGVidWdDbGllbnRWMi5qcy5tYXAiXX0=
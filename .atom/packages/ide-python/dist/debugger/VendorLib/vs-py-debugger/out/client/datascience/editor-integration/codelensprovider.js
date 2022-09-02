// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

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

const types_1 = require("../../common/types");

const types_2 = require("../../ioc/types");

const codewatcher_1 = require("./codewatcher");

let DataScienceCodeLensProvider = class DataScienceCodeLensProvider {
  constructor(serviceContainer, configuration) {
    this.serviceContainer = serviceContainer;
    this.configuration = configuration;
    this.activeCodeWatchers = [];
  } // CodeLensProvider interface
  // Some implementation based on DonJayamanne's jupyter extension work


  provideCodeLenses(document, token) {
    // Don't provide any code lenses if we have not enabled data science
    const settings = this.configuration.getSettings();

    if (!settings.datascience.enabled) {
      // Clear out any existing code watchers, providecodelenses is called on settings change
      // so we don't need to watch the settings change specifically here
      if (this.activeCodeWatchers.length > 0) {
        this.activeCodeWatchers = [];
      }

      return [];
    } // See if we already have a watcher for this file and version


    const codeWatcher = this.matchWatcher(document.fileName, document.version);

    if (codeWatcher) {
      return codeWatcher.getCodeLenses();
    } // Create a new watcher for this file


    const newCodeWatcher = new codewatcher_1.CodeWatcher(this.serviceContainer, document);
    this.activeCodeWatchers.push(newCodeWatcher);
    return newCodeWatcher.getCodeLenses();
  } // IDataScienceCodeLensProvider interface


  getCodeWatcher(document) {
    return this.matchWatcher(document.fileName, document.version);
  }

  matchWatcher(fileName, version) {
    const index = this.activeCodeWatchers.findIndex(item => item.getFileName() === fileName);

    if (index >= 0) {
      const item = this.activeCodeWatchers[index];

      if (item.getVersion() === version) {
        return item;
      } // If we have an old version remove it from the active list


      this.activeCodeWatchers.splice(index, 1);
    }

    return undefined;
  }

};
DataScienceCodeLensProvider = __decorate([inversify_1.injectable(), __param(0, inversify_1.inject(types_2.IServiceContainer)), __param(1, inversify_1.inject(types_1.IConfigurationService))], DataScienceCodeLensProvider);
exports.DataScienceCodeLensProvider = DataScienceCodeLensProvider;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvZGVsZW5zcHJvdmlkZXIuanMiXSwibmFtZXMiOlsiX19kZWNvcmF0ZSIsImRlY29yYXRvcnMiLCJ0YXJnZXQiLCJrZXkiLCJkZXNjIiwiYyIsImFyZ3VtZW50cyIsImxlbmd0aCIsInIiLCJPYmplY3QiLCJnZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IiLCJkIiwiUmVmbGVjdCIsImRlY29yYXRlIiwiaSIsImRlZmluZVByb3BlcnR5IiwiX19wYXJhbSIsInBhcmFtSW5kZXgiLCJkZWNvcmF0b3IiLCJleHBvcnRzIiwidmFsdWUiLCJpbnZlcnNpZnlfMSIsInJlcXVpcmUiLCJ0eXBlc18xIiwidHlwZXNfMiIsImNvZGV3YXRjaGVyXzEiLCJEYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXIiLCJjb25zdHJ1Y3RvciIsInNlcnZpY2VDb250YWluZXIiLCJjb25maWd1cmF0aW9uIiwiYWN0aXZlQ29kZVdhdGNoZXJzIiwicHJvdmlkZUNvZGVMZW5zZXMiLCJkb2N1bWVudCIsInRva2VuIiwic2V0dGluZ3MiLCJnZXRTZXR0aW5ncyIsImRhdGFzY2llbmNlIiwiZW5hYmxlZCIsImNvZGVXYXRjaGVyIiwibWF0Y2hXYXRjaGVyIiwiZmlsZU5hbWUiLCJ2ZXJzaW9uIiwiZ2V0Q29kZUxlbnNlcyIsIm5ld0NvZGVXYXRjaGVyIiwiQ29kZVdhdGNoZXIiLCJwdXNoIiwiZ2V0Q29kZVdhdGNoZXIiLCJpbmRleCIsImZpbmRJbmRleCIsIml0ZW0iLCJnZXRGaWxlTmFtZSIsImdldFZlcnNpb24iLCJzcGxpY2UiLCJ1bmRlZmluZWQiLCJpbmplY3RhYmxlIiwiaW5qZWN0IiwiSVNlcnZpY2VDb250YWluZXIiLCJJQ29uZmlndXJhdGlvblNlcnZpY2UiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTs7QUFDQSxJQUFJQSxVQUFVLEdBQUksVUFBUSxTQUFLQSxVQUFkLElBQTZCLFVBQVVDLFVBQVYsRUFBc0JDLE1BQXRCLEVBQThCQyxHQUE5QixFQUFtQ0MsSUFBbkMs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Q3FCLFdBQVcsQ0FBQ2lDLFVBQVosRUFEcUMsRUFFckN0QyxPQUFPLENBQUMsQ0FBRCxFQUFJSyxXQUFXLENBQUNrQyxNQUFaLENBQW1CL0IsT0FBTyxDQUFDZ0MsaUJBQTNCLENBQUosQ0FGOEIsRUFHckN4QyxPQUFPLENBQUMsQ0FBRCxFQUFJSyxXQUFXLENBQUNrQyxNQUFaLENBQW1CaEMsT0FBTyxDQUFDa0MscUJBQTNCLENBQUosQ0FIOEIsQ0FBRCxFQUlyQy9CLDJCQUpxQyxDQUF4QztBQUtBUCxPQUFPLENBQUNPLDJCQUFSLEdBQXNDQSwyQkFBdEMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbid1c2Ugc3RyaWN0JztcbnZhciBfX2RlY29yYXRlID0gKHRoaXMgJiYgdGhpcy5fX2RlY29yYXRlKSB8fCBmdW5jdGlvbiAoZGVjb3JhdG9ycywgdGFyZ2V0LCBrZXksIGRlc2MpIHtcbiAgICB2YXIgYyA9IGFyZ3VtZW50cy5sZW5ndGgsIHIgPSBjIDwgMyA/IHRhcmdldCA6IGRlc2MgPT09IG51bGwgPyBkZXNjID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0YXJnZXQsIGtleSkgOiBkZXNjLCBkO1xuICAgIGlmICh0eXBlb2YgUmVmbGVjdCA9PT0gXCJvYmplY3RcIiAmJiB0eXBlb2YgUmVmbGVjdC5kZWNvcmF0ZSA9PT0gXCJmdW5jdGlvblwiKSByID0gUmVmbGVjdC5kZWNvcmF0ZShkZWNvcmF0b3JzLCB0YXJnZXQsIGtleSwgZGVzYyk7XG4gICAgZWxzZSBmb3IgKHZhciBpID0gZGVjb3JhdG9ycy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgaWYgKGQgPSBkZWNvcmF0b3JzW2ldKSByID0gKGMgPCAzID8gZChyKSA6IGMgPiAzID8gZCh0YXJnZXQsIGtleSwgcikgOiBkKHRhcmdldCwga2V5KSkgfHwgcjtcbiAgICByZXR1cm4gYyA+IDMgJiYgciAmJiBPYmplY3QuZGVmaW5lUHJvcGVydHkodGFyZ2V0LCBrZXksIHIpLCByO1xufTtcbnZhciBfX3BhcmFtID0gKHRoaXMgJiYgdGhpcy5fX3BhcmFtKSB8fCBmdW5jdGlvbiAocGFyYW1JbmRleCwgZGVjb3JhdG9yKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQsIGtleSkgeyBkZWNvcmF0b3IodGFyZ2V0LCBrZXksIHBhcmFtSW5kZXgpOyB9XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgaW52ZXJzaWZ5XzEgPSByZXF1aXJlKFwiaW52ZXJzaWZ5XCIpO1xuY29uc3QgdHlwZXNfMSA9IHJlcXVpcmUoXCIuLi8uLi9jb21tb24vdHlwZXNcIik7XG5jb25zdCB0eXBlc18yID0gcmVxdWlyZShcIi4uLy4uL2lvYy90eXBlc1wiKTtcbmNvbnN0IGNvZGV3YXRjaGVyXzEgPSByZXF1aXJlKFwiLi9jb2Rld2F0Y2hlclwiKTtcbmxldCBEYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXIgPSBjbGFzcyBEYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXIge1xuICAgIGNvbnN0cnVjdG9yKHNlcnZpY2VDb250YWluZXIsIGNvbmZpZ3VyYXRpb24pIHtcbiAgICAgICAgdGhpcy5zZXJ2aWNlQ29udGFpbmVyID0gc2VydmljZUNvbnRhaW5lcjtcbiAgICAgICAgdGhpcy5jb25maWd1cmF0aW9uID0gY29uZmlndXJhdGlvbjtcbiAgICAgICAgdGhpcy5hY3RpdmVDb2RlV2F0Y2hlcnMgPSBbXTtcbiAgICB9XG4gICAgLy8gQ29kZUxlbnNQcm92aWRlciBpbnRlcmZhY2VcbiAgICAvLyBTb21lIGltcGxlbWVudGF0aW9uIGJhc2VkIG9uIERvbkpheWFtYW5uZSdzIGp1cHl0ZXIgZXh0ZW5zaW9uIHdvcmtcbiAgICBwcm92aWRlQ29kZUxlbnNlcyhkb2N1bWVudCwgdG9rZW4pIHtcbiAgICAgICAgLy8gRG9uJ3QgcHJvdmlkZSBhbnkgY29kZSBsZW5zZXMgaWYgd2UgaGF2ZSBub3QgZW5hYmxlZCBkYXRhIHNjaWVuY2VcbiAgICAgICAgY29uc3Qgc2V0dGluZ3MgPSB0aGlzLmNvbmZpZ3VyYXRpb24uZ2V0U2V0dGluZ3MoKTtcbiAgICAgICAgaWYgKCFzZXR0aW5ncy5kYXRhc2NpZW5jZS5lbmFibGVkKSB7XG4gICAgICAgICAgICAvLyBDbGVhciBvdXQgYW55IGV4aXN0aW5nIGNvZGUgd2F0Y2hlcnMsIHByb3ZpZGVjb2RlbGVuc2VzIGlzIGNhbGxlZCBvbiBzZXR0aW5ncyBjaGFuZ2VcbiAgICAgICAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gd2F0Y2ggdGhlIHNldHRpbmdzIGNoYW5nZSBzcGVjaWZpY2FsbHkgaGVyZVxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aXZlQ29kZVdhdGNoZXJzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmFjdGl2ZUNvZGVXYXRjaGVycyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICB9XG4gICAgICAgIC8vIFNlZSBpZiB3ZSBhbHJlYWR5IGhhdmUgYSB3YXRjaGVyIGZvciB0aGlzIGZpbGUgYW5kIHZlcnNpb25cbiAgICAgICAgY29uc3QgY29kZVdhdGNoZXIgPSB0aGlzLm1hdGNoV2F0Y2hlcihkb2N1bWVudC5maWxlTmFtZSwgZG9jdW1lbnQudmVyc2lvbik7XG4gICAgICAgIGlmIChjb2RlV2F0Y2hlcikge1xuICAgICAgICAgICAgcmV0dXJuIGNvZGVXYXRjaGVyLmdldENvZGVMZW5zZXMoKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBDcmVhdGUgYSBuZXcgd2F0Y2hlciBmb3IgdGhpcyBmaWxlXG4gICAgICAgIGNvbnN0IG5ld0NvZGVXYXRjaGVyID0gbmV3IGNvZGV3YXRjaGVyXzEuQ29kZVdhdGNoZXIodGhpcy5zZXJ2aWNlQ29udGFpbmVyLCBkb2N1bWVudCk7XG4gICAgICAgIHRoaXMuYWN0aXZlQ29kZVdhdGNoZXJzLnB1c2gobmV3Q29kZVdhdGNoZXIpO1xuICAgICAgICByZXR1cm4gbmV3Q29kZVdhdGNoZXIuZ2V0Q29kZUxlbnNlcygpO1xuICAgIH1cbiAgICAvLyBJRGF0YVNjaWVuY2VDb2RlTGVuc1Byb3ZpZGVyIGludGVyZmFjZVxuICAgIGdldENvZGVXYXRjaGVyKGRvY3VtZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hdGNoV2F0Y2hlcihkb2N1bWVudC5maWxlTmFtZSwgZG9jdW1lbnQudmVyc2lvbik7XG4gICAgfVxuICAgIG1hdGNoV2F0Y2hlcihmaWxlTmFtZSwgdmVyc2lvbikge1xuICAgICAgICBjb25zdCBpbmRleCA9IHRoaXMuYWN0aXZlQ29kZVdhdGNoZXJzLmZpbmRJbmRleChpdGVtID0+IGl0ZW0uZ2V0RmlsZU5hbWUoKSA9PT0gZmlsZU5hbWUpO1xuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuYWN0aXZlQ29kZVdhdGNoZXJzW2luZGV4XTtcbiAgICAgICAgICAgIGlmIChpdGVtLmdldFZlcnNpb24oKSA9PT0gdmVyc2lvbikge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gSWYgd2UgaGF2ZSBhbiBvbGQgdmVyc2lvbiByZW1vdmUgaXQgZnJvbSB0aGUgYWN0aXZlIGxpc3RcbiAgICAgICAgICAgIHRoaXMuYWN0aXZlQ29kZVdhdGNoZXJzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG59O1xuRGF0YVNjaWVuY2VDb2RlTGVuc1Byb3ZpZGVyID0gX19kZWNvcmF0ZShbXG4gICAgaW52ZXJzaWZ5XzEuaW5qZWN0YWJsZSgpLFxuICAgIF9fcGFyYW0oMCwgaW52ZXJzaWZ5XzEuaW5qZWN0KHR5cGVzXzIuSVNlcnZpY2VDb250YWluZXIpKSxcbiAgICBfX3BhcmFtKDEsIGludmVyc2lmeV8xLmluamVjdCh0eXBlc18xLklDb25maWd1cmF0aW9uU2VydmljZSkpXG5dLCBEYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXIpO1xuZXhwb3J0cy5EYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXIgPSBEYXRhU2NpZW5jZUNvZGVMZW5zUHJvdmlkZXI7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1jb2RlbGVuc3Byb3ZpZGVyLmpzLm1hcCJdfQ==
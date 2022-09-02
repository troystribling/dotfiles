// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

const types_1 = require("../common/nuget/types");

const types_2 = require("../common/types");

const dataScienceSurveyBanner_1 = require("../datascience/dataScienceSurveyBanner");

const languageServerSurveyBanner_1 = require("../languageServices/languageServerSurveyBanner");

const proposeLanguageServerBanner_1 = require("../languageServices/proposeLanguageServerBanner");

const activationService_1 = require("./activationService");

const downloadChannelRules_1 = require("./downloadChannelRules");

const jedi_1 = require("./jedi");

const languageServer_1 = require("./languageServer/languageServer");

const languageServerFolderService_1 = require("./languageServer/languageServerFolderService");

const languageServerPackageRepository_1 = require("./languageServer/languageServerPackageRepository");

const languageServerPackageService_1 = require("./languageServer/languageServerPackageService");

const types_3 = require("./types");

function registerTypes(serviceManager) {
  serviceManager.addSingleton(types_3.IExtensionActivationService, activationService_1.ExtensionActivationService);
  serviceManager.add(types_3.IExtensionActivator, jedi_1.JediExtensionActivator, types_3.ExtensionActivators.Jedi);
  serviceManager.add(types_3.IExtensionActivator, languageServer_1.LanguageServerExtensionActivator, types_3.ExtensionActivators.DotNet);
  serviceManager.addSingleton(types_2.IPythonExtensionBanner, languageServerSurveyBanner_1.LanguageServerSurveyBanner, types_2.BANNER_NAME_LS_SURVEY);
  serviceManager.addSingleton(types_2.IPythonExtensionBanner, proposeLanguageServerBanner_1.ProposeLanguageServerBanner, types_2.BANNER_NAME_PROPOSE_LS);
  serviceManager.addSingleton(types_2.IPythonExtensionBanner, dataScienceSurveyBanner_1.DataScienceSurveyBanner, types_2.BANNER_NAME_DS_SURVEY);
  serviceManager.addSingleton(types_3.ILanguageServerFolderService, languageServerFolderService_1.LanguageServerFolderService);
  serviceManager.addSingleton(types_3.ILanguageServerPackageService, languageServerPackageService_1.LanguageServerPackageService);
  serviceManager.addSingleton(types_1.INugetRepository, languageServerPackageRepository_1.StableLanguageServerPackageRepository, languageServerPackageRepository_1.LanguageServerDownloadChannel.stable);
  serviceManager.addSingleton(types_1.INugetRepository, languageServerPackageRepository_1.BetaLanguageServerPackageRepository, languageServerPackageRepository_1.LanguageServerDownloadChannel.beta);
  serviceManager.addSingleton(types_1.INugetRepository, languageServerPackageRepository_1.DailyLanguageServerPackageRepository, languageServerPackageRepository_1.LanguageServerDownloadChannel.daily);
  serviceManager.addSingleton(types_3.IDownloadChannelRule, downloadChannelRules_1.DownloadDailyChannelRule, languageServerPackageRepository_1.LanguageServerDownloadChannel.daily);
  serviceManager.addSingleton(types_3.IDownloadChannelRule, downloadChannelRules_1.DownloadBetaChannelRule, languageServerPackageRepository_1.LanguageServerDownloadChannel.beta);
  serviceManager.addSingleton(types_3.IDownloadChannelRule, downloadChannelRules_1.DownloadStableChannelRule, languageServerPackageRepository_1.LanguageServerDownloadChannel.stable);
}

exports.registerTypes = registerTypes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNlcnZpY2VSZWdpc3RyeS5qcyJdLCJuYW1lcyI6WyJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImV4cG9ydHMiLCJ2YWx1ZSIsInR5cGVzXzEiLCJyZXF1aXJlIiwidHlwZXNfMiIsImRhdGFTY2llbmNlU3VydmV5QmFubmVyXzEiLCJsYW5ndWFnZVNlcnZlclN1cnZleUJhbm5lcl8xIiwicHJvcG9zZUxhbmd1YWdlU2VydmVyQmFubmVyXzEiLCJhY3RpdmF0aW9uU2VydmljZV8xIiwiZG93bmxvYWRDaGFubmVsUnVsZXNfMSIsImplZGlfMSIsImxhbmd1YWdlU2VydmVyXzEiLCJsYW5ndWFnZVNlcnZlckZvbGRlclNlcnZpY2VfMSIsImxhbmd1YWdlU2VydmVyUGFja2FnZVJlcG9zaXRvcnlfMSIsImxhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2VfMSIsInR5cGVzXzMiLCJyZWdpc3RlclR5cGVzIiwic2VydmljZU1hbmFnZXIiLCJhZGRTaW5nbGV0b24iLCJJRXh0ZW5zaW9uQWN0aXZhdGlvblNlcnZpY2UiLCJFeHRlbnNpb25BY3RpdmF0aW9uU2VydmljZSIsImFkZCIsIklFeHRlbnNpb25BY3RpdmF0b3IiLCJKZWRpRXh0ZW5zaW9uQWN0aXZhdG9yIiwiRXh0ZW5zaW9uQWN0aXZhdG9ycyIsIkplZGkiLCJMYW5ndWFnZVNlcnZlckV4dGVuc2lvbkFjdGl2YXRvciIsIkRvdE5ldCIsIklQeXRob25FeHRlbnNpb25CYW5uZXIiLCJMYW5ndWFnZVNlcnZlclN1cnZleUJhbm5lciIsIkJBTk5FUl9OQU1FX0xTX1NVUlZFWSIsIlByb3Bvc2VMYW5ndWFnZVNlcnZlckJhbm5lciIsIkJBTk5FUl9OQU1FX1BST1BPU0VfTFMiLCJEYXRhU2NpZW5jZVN1cnZleUJhbm5lciIsIkJBTk5FUl9OQU1FX0RTX1NVUlZFWSIsIklMYW5ndWFnZVNlcnZlckZvbGRlclNlcnZpY2UiLCJMYW5ndWFnZVNlcnZlckZvbGRlclNlcnZpY2UiLCJJTGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlU2VydmljZSIsIkxhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2UiLCJJTnVnZXRSZXBvc2l0b3J5IiwiU3RhYmxlTGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeSIsIkxhbmd1YWdlU2VydmVyRG93bmxvYWRDaGFubmVsIiwic3RhYmxlIiwiQmV0YUxhbmd1YWdlU2VydmVyUGFja2FnZVJlcG9zaXRvcnkiLCJiZXRhIiwiRGFpbHlMYW5ndWFnZVNlcnZlclBhY2thZ2VSZXBvc2l0b3J5IiwiZGFpbHkiLCJJRG93bmxvYWRDaGFubmVsUnVsZSIsIkRvd25sb2FkRGFpbHlDaGFubmVsUnVsZSIsIkRvd25sb2FkQmV0YUNoYW5uZWxSdWxlIiwiRG93bmxvYWRTdGFibGVDaGFubmVsUnVsZSJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBOztBQUNBQSxNQUFNLENBQUNDLGNBQVAsQ0FBc0JDLE9BQXRCLEVBQStCLFlBQS9CLEVBQTZDO0FBQUVDLEVBQUFBLEtBQUssRUFBRTtBQUFULENBQTdDOztBQUNBLE1BQU1DLE9BQU8sR0FBR0MsT0FBTyxDQUFDLHVCQUFELENBQXZCOztBQUNBLE1BQU1DLE9BQU8sR0FBR0QsT0FBTyxDQUFDLGlCQUFELENBQXZCOztBQUNBLE1BQU1FLHlCQUF5QixHQUFHRixPQUFPLENBQUMsd0NBQUQsQ0FBekM7O0FBQ0EsTUFBTUcsNEJBQTRCLEdBQUdILE9BQU8sQ0FBQyxnREFBRCxDQUE1Qzs7QUFDQSxNQUFNSSw2QkFBNkIsR0FBR0osT0FBTyxDQUFDLGlEQUFELENBQTdDOztBQUNBLE1BQU1LLG1CQUFtQixHQUFHTCxPQUFPLENBQUMscUJBQUQsQ0FBbkM7O0FBQ0EsTUFBTU0sc0JBQXNCLEdBQUdOLE9BQU8sQ0FBQyx3QkFBRCxDQUF0Qzs7QUFDQSxNQUFNTyxNQUFNLEdBQUdQLE9BQU8sQ0FBQyxRQUFELENBQXRCOztBQUNBLE1BQU1RLGdCQUFnQixHQUFHUixPQUFPLENBQUMsaUNBQUQsQ0FBaEM7O0FBQ0EsTUFBTVMsNkJBQTZCLEdBQUdULE9B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LGFBQXhCIiwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuXG4ndXNlIHN0cmljdCc7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5jb25zdCB0eXBlc18xID0gcmVxdWlyZShcIi4uL2NvbW1vbi9udWdldC90eXBlc1wiKTtcbmNvbnN0IHR5cGVzXzIgPSByZXF1aXJlKFwiLi4vY29tbW9uL3R5cGVzXCIpO1xuY29uc3QgZGF0YVNjaWVuY2VTdXJ2ZXlCYW5uZXJfMSA9IHJlcXVpcmUoXCIuLi9kYXRhc2NpZW5jZS9kYXRhU2NpZW5jZVN1cnZleUJhbm5lclwiKTtcbmNvbnN0IGxhbmd1YWdlU2VydmVyU3VydmV5QmFubmVyXzEgPSByZXF1aXJlKFwiLi4vbGFuZ3VhZ2VTZXJ2aWNlcy9sYW5ndWFnZVNlcnZlclN1cnZleUJhbm5lclwiKTtcbmNvbnN0IHByb3Bvc2VMYW5ndWFnZVNlcnZlckJhbm5lcl8xID0gcmVxdWlyZShcIi4uL2xhbmd1YWdlU2VydmljZXMvcHJvcG9zZUxhbmd1YWdlU2VydmVyQmFubmVyXCIpO1xuY29uc3QgYWN0aXZhdGlvblNlcnZpY2VfMSA9IHJlcXVpcmUoXCIuL2FjdGl2YXRpb25TZXJ2aWNlXCIpO1xuY29uc3QgZG93bmxvYWRDaGFubmVsUnVsZXNfMSA9IHJlcXVpcmUoXCIuL2Rvd25sb2FkQ2hhbm5lbFJ1bGVzXCIpO1xuY29uc3QgamVkaV8xID0gcmVxdWlyZShcIi4vamVkaVwiKTtcbmNvbnN0IGxhbmd1YWdlU2VydmVyXzEgPSByZXF1aXJlKFwiLi9sYW5ndWFnZVNlcnZlci9sYW5ndWFnZVNlcnZlclwiKTtcbmNvbnN0IGxhbmd1YWdlU2VydmVyRm9sZGVyU2VydmljZV8xID0gcmVxdWlyZShcIi4vbGFuZ3VhZ2VTZXJ2ZXIvbGFuZ3VhZ2VTZXJ2ZXJGb2xkZXJTZXJ2aWNlXCIpO1xuY29uc3QgbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeV8xID0gcmVxdWlyZShcIi4vbGFuZ3VhZ2VTZXJ2ZXIvbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeVwiKTtcbmNvbnN0IGxhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2VfMSA9IHJlcXVpcmUoXCIuL2xhbmd1YWdlU2VydmVyL2xhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2VcIik7XG5jb25zdCB0eXBlc18zID0gcmVxdWlyZShcIi4vdHlwZXNcIik7XG5mdW5jdGlvbiByZWdpc3RlclR5cGVzKHNlcnZpY2VNYW5hZ2VyKSB7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzMuSUV4dGVuc2lvbkFjdGl2YXRpb25TZXJ2aWNlLCBhY3RpdmF0aW9uU2VydmljZV8xLkV4dGVuc2lvbkFjdGl2YXRpb25TZXJ2aWNlKTtcbiAgICBzZXJ2aWNlTWFuYWdlci5hZGQodHlwZXNfMy5JRXh0ZW5zaW9uQWN0aXZhdG9yLCBqZWRpXzEuSmVkaUV4dGVuc2lvbkFjdGl2YXRvciwgdHlwZXNfMy5FeHRlbnNpb25BY3RpdmF0b3JzLkplZGkpO1xuICAgIHNlcnZpY2VNYW5hZ2VyLmFkZCh0eXBlc18zLklFeHRlbnNpb25BY3RpdmF0b3IsIGxhbmd1YWdlU2VydmVyXzEuTGFuZ3VhZ2VTZXJ2ZXJFeHRlbnNpb25BY3RpdmF0b3IsIHR5cGVzXzMuRXh0ZW5zaW9uQWN0aXZhdG9ycy5Eb3ROZXQpO1xuICAgIHNlcnZpY2VNYW5hZ2VyLmFkZFNpbmdsZXRvbih0eXBlc18yLklQeXRob25FeHRlbnNpb25CYW5uZXIsIGxhbmd1YWdlU2VydmVyU3VydmV5QmFubmVyXzEuTGFuZ3VhZ2VTZXJ2ZXJTdXJ2ZXlCYW5uZXIsIHR5cGVzXzIuQkFOTkVSX05BTUVfTFNfU1VSVkVZKTtcbiAgICBzZXJ2aWNlTWFuYWdlci5hZGRTaW5nbGV0b24odHlwZXNfMi5JUHl0aG9uRXh0ZW5zaW9uQmFubmVyLCBwcm9wb3NlTGFuZ3VhZ2VTZXJ2ZXJCYW5uZXJfMS5Qcm9wb3NlTGFuZ3VhZ2VTZXJ2ZXJCYW5uZXIsIHR5cGVzXzIuQkFOTkVSX05BTUVfUFJPUE9TRV9MUyk7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzIuSVB5dGhvbkV4dGVuc2lvbkJhbm5lciwgZGF0YVNjaWVuY2VTdXJ2ZXlCYW5uZXJfMS5EYXRhU2NpZW5jZVN1cnZleUJhbm5lciwgdHlwZXNfMi5CQU5ORVJfTkFNRV9EU19TVVJWRVkpO1xuICAgIHNlcnZpY2VNYW5hZ2VyLmFkZFNpbmdsZXRvbih0eXBlc18zLklMYW5ndWFnZVNlcnZlckZvbGRlclNlcnZpY2UsIGxhbmd1YWdlU2VydmVyRm9sZGVyU2VydmljZV8xLkxhbmd1YWdlU2VydmVyRm9sZGVyU2VydmljZSk7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzMuSUxhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2UsIGxhbmd1YWdlU2VydmVyUGFja2FnZVNlcnZpY2VfMS5MYW5ndWFnZVNlcnZlclBhY2thZ2VTZXJ2aWNlKTtcbiAgICBzZXJ2aWNlTWFuYWdlci5hZGRTaW5nbGV0b24odHlwZXNfMS5JTnVnZXRSZXBvc2l0b3J5LCBsYW5ndWFnZVNlcnZlclBhY2thZ2VSZXBvc2l0b3J5XzEuU3RhYmxlTGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeSwgbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeV8xLkxhbmd1YWdlU2VydmVyRG93bmxvYWRDaGFubmVsLnN0YWJsZSk7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzEuSU51Z2V0UmVwb3NpdG9yeSwgbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeV8xLkJldGFMYW5ndWFnZVNlcnZlclBhY2thZ2VSZXBvc2l0b3J5LCBsYW5ndWFnZVNlcnZlclBhY2thZ2VSZXBvc2l0b3J5XzEuTGFuZ3VhZ2VTZXJ2ZXJEb3dubG9hZENoYW5uZWwuYmV0YSk7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzEuSU51Z2V0UmVwb3NpdG9yeSwgbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeV8xLkRhaWx5TGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeSwgbGFuZ3VhZ2VTZXJ2ZXJQYWNrYWdlUmVwb3NpdG9yeV8xLkxhbmd1YWdlU2VydmVyRG93bmxvYWRDaGFubmVsLmRhaWx5KTtcbiAgICBzZXJ2aWNlTWFuYWdlci5hZGRTaW5nbGV0b24odHlwZXNfMy5JRG93bmxvYWRDaGFubmVsUnVsZSwgZG93bmxvYWRDaGFubmVsUnVsZXNfMS5Eb3dubG9hZERhaWx5Q2hhbm5lbFJ1bGUsIGxhbmd1YWdlU2VydmVyUGFja2FnZVJlcG9zaXRvcnlfMS5MYW5ndWFnZVNlcnZlckRvd25sb2FkQ2hhbm5lbC5kYWlseSk7XG4gICAgc2VydmljZU1hbmFnZXIuYWRkU2luZ2xldG9uKHR5cGVzXzMuSURvd25sb2FkQ2hhbm5lbFJ1bGUsIGRvd25sb2FkQ2hhbm5lbFJ1bGVzXzEuRG93bmxvYWRCZXRhQ2hhbm5lbFJ1bGUsIGxhbmd1YWdlU2VydmVyUGFja2FnZVJlcG9zaXRvcnlfMS5MYW5ndWFnZVNlcnZlckRvd25sb2FkQ2hhbm5lbC5iZXRhKTtcbiAgICBzZXJ2aWNlTWFuYWdlci5hZGRTaW5nbGV0b24odHlwZXNfMy5JRG93bmxvYWRDaGFubmVsUnVsZSwgZG93bmxvYWRDaGFubmVsUnVsZXNfMS5Eb3dubG9hZFN0YWJsZUNoYW5uZWxSdWxlLCBsYW5ndWFnZVNlcnZlclBhY2thZ2VSZXBvc2l0b3J5XzEuTGFuZ3VhZ2VTZXJ2ZXJEb3dubG9hZENoYW5uZWwuc3RhYmxlKTtcbn1cbmV4cG9ydHMucmVnaXN0ZXJUeXBlcyA9IHJlZ2lzdGVyVHlwZXM7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1zZXJ2aWNlUmVnaXN0cnkuanMubWFwIl19
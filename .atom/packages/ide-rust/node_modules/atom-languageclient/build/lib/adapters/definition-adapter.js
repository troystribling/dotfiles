"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const convert_1 = require("../convert");
const Utils = require("../utils");
const atom_1 = require("atom");
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class DefinitionAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a definitionProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.definitionProvider === true;
    }
    // Public: Get the definitions for a symbol at a given {Point} within a
    // {TextEditor} including optionally highlighting all other references
    // within the document if the langauge server also supports highlighting.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide definitions and highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `languageName` The name of the programming language.
    // * `editor` The Atom {TextEditor} containing the symbol and potential highlights.
    // * `point` The Atom {Point} containing the position of the text that represents the symbol
    //           for which the definition and highlights should be provided.
    //
    // Returns a {Promise} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    getDefinition(connection, serverCapabilities, languageName, editor, point) {
        return __awaiter(this, void 0, void 0, function* () {
            const documentPositionParams = convert_1.default.editorToTextDocumentPositionParams(editor, point);
            const definitionLocations = DefinitionAdapter.normalizeLocations(yield connection.gotoDefinition(documentPositionParams));
            if (definitionLocations == null || definitionLocations.length === 0) {
                return null;
            }
            let queryRange;
            if (serverCapabilities.documentHighlightProvider) {
                const highlights = yield connection.documentHighlight(documentPositionParams);
                if (highlights != null && highlights.length > 0) {
                    queryRange = highlights.map((h) => convert_1.default.lsRangeToAtomRange(h.range));
                }
            }
            return {
                queryRange: queryRange || [Utils.getWordAtPosition(editor, point)],
                definitions: DefinitionAdapter.convertLocationsToDefinitions(definitionLocations, languageName),
            };
        });
    }
    // Public: Normalize the locations so a single {Location} becomes an {Array} of just
    // one. The language server protocol return either as the protocol evolved between v1 and v2.
    //
    // * `locationResult` either a single {Location} object or an {Array} of {Locations}
    //
    // Returns an {Array} of {Location}s or {null} if the locationResult was null.
    static normalizeLocations(locationResult) {
        if (locationResult == null) {
            return null;
        }
        return (Array.isArray(locationResult) ? locationResult : [locationResult]).filter((d) => d.range.start != null);
    }
    // Public: Convert an {Array} of {Location} objects into an Array of {Definition}s.
    //
    // * `locations` An {Array} of {Location} objects to be converted.
    // * `languageName` The name of the language these objects are written in.
    //
    // Returns an {Array} of {Definition}s that represented the converted {Location}s.
    static convertLocationsToDefinitions(locations, languageName) {
        return locations.map((d) => ({
            path: convert_1.default.uriToPath(d.uri),
            position: convert_1.default.positionToPoint(d.range.start),
            range: atom_1.Range.fromObject(convert_1.default.lsRangeToAtomRange(d.range)),
            language: languageName,
        }));
    }
}
exports.default = DefinitionAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmaW5pdGlvbi1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2RlZmluaXRpb24tYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBQ2pDLGtDQUFrQztBQU1sQywrQkFJYztBQUVkLGdFQUFnRTtBQUNoRSx3RUFBd0U7QUFDeEUsTUFBcUIsaUJBQWlCO0lBQ3BDLGdGQUFnRjtJQUNoRiwwRUFBMEU7SUFDMUUsRUFBRTtJQUNGLHNGQUFzRjtJQUN0RixFQUFFO0lBQ0YsMkVBQTJFO0lBQzNFLDRCQUE0QjtJQUNyQixNQUFNLENBQUMsUUFBUSxDQUFDLGtCQUFzQztRQUMzRCxPQUFPLGtCQUFrQixDQUFDLGtCQUFrQixLQUFLLElBQUksQ0FBQztJQUN4RCxDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLHNFQUFzRTtJQUN0RSx5RUFBeUU7SUFDekUsRUFBRTtJQUNGLG1IQUFtSDtJQUNuSCw0RkFBNEY7SUFDNUYseURBQXlEO0lBQ3pELG1GQUFtRjtJQUNuRiw0RkFBNEY7SUFDNUYsd0VBQXdFO0lBQ3hFLEVBQUU7SUFDRiwyRUFBMkU7SUFDM0UsNEJBQTRCO0lBQ2YsYUFBYSxDQUN4QixVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsWUFBb0IsRUFDcEIsTUFBa0IsRUFDbEIsS0FBWTs7WUFFWixNQUFNLHNCQUFzQixHQUFHLGlCQUFPLENBQUMsa0NBQWtDLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3pGLE1BQU0sbUJBQW1CLEdBQUcsaUJBQWlCLENBQUMsa0JBQWtCLENBQzlELE1BQU0sVUFBVSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUN4RCxDQUFDO1lBQ0YsSUFBSSxtQkFBbUIsSUFBSSxJQUFJLElBQUksbUJBQW1CLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDbkUsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELElBQUksVUFBVSxDQUFDO1lBQ2YsSUFBSSxrQkFBa0IsQ0FBQyx5QkFBeUIsRUFBRTtnQkFDaEQsTUFBTSxVQUFVLEdBQUcsTUFBTSxVQUFVLENBQUMsaUJBQWlCLENBQUMsc0JBQXNCLENBQUMsQ0FBQztnQkFDOUUsSUFBSSxVQUFVLElBQUksSUFBSSxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO29CQUMvQyxVQUFVLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDekU7YUFDRjtZQUVELE9BQU87Z0JBQ0wsVUFBVSxFQUFFLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQ2xFLFdBQVcsRUFBRSxpQkFBaUIsQ0FBQyw2QkFBNkIsQ0FBQyxtQkFBbUIsRUFBRSxZQUFZLENBQUM7YUFDaEcsQ0FBQztRQUNKLENBQUM7S0FBQTtJQUVELG9GQUFvRjtJQUNwRiw2RkFBNkY7SUFDN0YsRUFBRTtJQUNGLG9GQUFvRjtJQUNwRixFQUFFO0lBQ0YsOEVBQThFO0lBQ3ZFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxjQUFxQztRQUNwRSxJQUFJLGNBQWMsSUFBSSxJQUFJLEVBQUU7WUFDMUIsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUNELE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ2xILENBQUM7SUFFRCxtRkFBbUY7SUFDbkYsRUFBRTtJQUNGLGtFQUFrRTtJQUNsRSwwRUFBMEU7SUFDMUUsRUFBRTtJQUNGLGtGQUFrRjtJQUMzRSxNQUFNLENBQUMsNkJBQTZCLENBQUMsU0FBcUIsRUFBRSxZQUFvQjtRQUNyRixPQUFPLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDM0IsSUFBSSxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUM7WUFDOUIsUUFBUSxFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1lBQ2hELEtBQUssRUFBRSxZQUFLLENBQUMsVUFBVSxDQUFDLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzVELFFBQVEsRUFBRSxZQUFZO1NBQ3ZCLENBQUMsQ0FBQyxDQUFDO0lBQ04sQ0FBQztDQUNGO0FBakZELG9DQWlGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQge1xuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIExvY2F0aW9uLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBUZXh0RWRpdG9yLFxuICBSYW5nZSxcbn0gZnJvbSAnYXRvbSc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgZGVmaW5pdGlvbiBwcm92aWRlciB0byB0aGVcbi8vIEF0b20gSURFIFVJIERlZmluaXRpb25zIHBhY2thZ2UgZm9yICdHbyBUbyBEZWZpbml0aW9uJyBmdW5jdGlvbmFsaXR5LlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgRGVmaW5pdGlvbkFkYXB0ZXIge1xuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgZGVmaW5pdGlvblByb3ZpZGVyLlxuICAvL1xuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGNvbnNpZGVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5kZWZpbml0aW9uUHJvdmlkZXIgPT09IHRydWU7XG4gIH1cblxuICAvLyBQdWJsaWM6IEdldCB0aGUgZGVmaW5pdGlvbnMgZm9yIGEgc3ltYm9sIGF0IGEgZ2l2ZW4ge1BvaW50fSB3aXRoaW4gYVxuICAvLyB7VGV4dEVkaXRvcn0gaW5jbHVkaW5nIG9wdGlvbmFsbHkgaGlnaGxpZ2h0aW5nIGFsbCBvdGhlciByZWZlcmVuY2VzXG4gIC8vIHdpdGhpbiB0aGUgZG9jdW1lbnQgaWYgdGhlIGxhbmdhdWdlIHNlcnZlciBhbHNvIHN1cHBvcnRzIGhpZ2hsaWdodGluZy5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBwcm92aWRlIGRlZmluaXRpb25zIGFuZCBoaWdobGlnaHRzLlxuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSB1c2VkLlxuICAvLyAqIGBsYW5ndWFnZU5hbWVgIFRoZSBuYW1lIG9mIHRoZSBwcm9ncmFtbWluZyBsYW5ndWFnZS5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgc3ltYm9sIGFuZCBwb3RlbnRpYWwgaGlnaGxpZ2h0cy5cbiAgLy8gKiBgcG9pbnRgIFRoZSBBdG9tIHtQb2ludH0gY29udGFpbmluZyB0aGUgcG9zaXRpb24gb2YgdGhlIHRleHQgdGhhdCByZXByZXNlbnRzIHRoZSBzeW1ib2xcbiAgLy8gICAgICAgICAgIGZvciB3aGljaCB0aGUgZGVmaW5pdGlvbiBhbmQgaGlnaGxpZ2h0cyBzaG91bGQgYmUgcHJvdmlkZWQuXG4gIC8vXG4gIC8vIFJldHVybnMgYSB7UHJvbWlzZX0gaW5kaWNhdGluZyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBhc3luYyBnZXREZWZpbml0aW9uKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyxcbiAgICBsYW5ndWFnZU5hbWU6IHN0cmluZyxcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICApOiBQcm9taXNlPGF0b21JZGUuRGVmaW5pdGlvblF1ZXJ5UmVzdWx0IHwgbnVsbD4ge1xuICAgIGNvbnN0IGRvY3VtZW50UG9zaXRpb25QYXJhbXMgPSBDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMoZWRpdG9yLCBwb2ludCk7XG4gICAgY29uc3QgZGVmaW5pdGlvbkxvY2F0aW9ucyA9IERlZmluaXRpb25BZGFwdGVyLm5vcm1hbGl6ZUxvY2F0aW9ucyhcbiAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZ290b0RlZmluaXRpb24oZG9jdW1lbnRQb3NpdGlvblBhcmFtcyksXG4gICAgKTtcbiAgICBpZiAoZGVmaW5pdGlvbkxvY2F0aW9ucyA9PSBudWxsIHx8IGRlZmluaXRpb25Mb2NhdGlvbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBsZXQgcXVlcnlSYW5nZTtcbiAgICBpZiAoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIpIHtcbiAgICAgIGNvbnN0IGhpZ2hsaWdodHMgPSBhd2FpdCBjb25uZWN0aW9uLmRvY3VtZW50SGlnaGxpZ2h0KGRvY3VtZW50UG9zaXRpb25QYXJhbXMpO1xuICAgICAgaWYgKGhpZ2hsaWdodHMgIT0gbnVsbCAmJiBoaWdobGlnaHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcXVlcnlSYW5nZSA9IGhpZ2hsaWdodHMubWFwKChoKSA9PiBDb252ZXJ0LmxzUmFuZ2VUb0F0b21SYW5nZShoLnJhbmdlKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHF1ZXJ5UmFuZ2U6IHF1ZXJ5UmFuZ2UgfHwgW1V0aWxzLmdldFdvcmRBdFBvc2l0aW9uKGVkaXRvciwgcG9pbnQpXSxcbiAgICAgIGRlZmluaXRpb25zOiBEZWZpbml0aW9uQWRhcHRlci5jb252ZXJ0TG9jYXRpb25zVG9EZWZpbml0aW9ucyhkZWZpbml0aW9uTG9jYXRpb25zLCBsYW5ndWFnZU5hbWUpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IE5vcm1hbGl6ZSB0aGUgbG9jYXRpb25zIHNvIGEgc2luZ2xlIHtMb2NhdGlvbn0gYmVjb21lcyBhbiB7QXJyYXl9IG9mIGp1c3RcbiAgLy8gb25lLiBUaGUgbGFuZ3VhZ2Ugc2VydmVyIHByb3RvY29sIHJldHVybiBlaXRoZXIgYXMgdGhlIHByb3RvY29sIGV2b2x2ZWQgYmV0d2VlbiB2MSBhbmQgdjIuXG4gIC8vXG4gIC8vICogYGxvY2F0aW9uUmVzdWx0YCBlaXRoZXIgYSBzaW5nbGUge0xvY2F0aW9ufSBvYmplY3Qgb3IgYW4ge0FycmF5fSBvZiB7TG9jYXRpb25zfVxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge0xvY2F0aW9ufXMgb3Ige251bGx9IGlmIHRoZSBsb2NhdGlvblJlc3VsdCB3YXMgbnVsbC5cbiAgcHVibGljIHN0YXRpYyBub3JtYWxpemVMb2NhdGlvbnMobG9jYXRpb25SZXN1bHQ6IExvY2F0aW9uIHwgTG9jYXRpb25bXSk6IExvY2F0aW9uW10gfCBudWxsIHtcbiAgICBpZiAobG9jYXRpb25SZXN1bHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiAoQXJyYXkuaXNBcnJheShsb2NhdGlvblJlc3VsdCkgPyBsb2NhdGlvblJlc3VsdCA6IFtsb2NhdGlvblJlc3VsdF0pLmZpbHRlcigoZCkgPT4gZC5yYW5nZS5zdGFydCAhPSBudWxsKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhbiB7QXJyYXl9IG9mIHtMb2NhdGlvbn0gb2JqZWN0cyBpbnRvIGFuIEFycmF5IG9mIHtEZWZpbml0aW9ufXMuXG4gIC8vXG4gIC8vICogYGxvY2F0aW9uc2AgQW4ge0FycmF5fSBvZiB7TG9jYXRpb259IG9iamVjdHMgdG8gYmUgY29udmVydGVkLlxuICAvLyAqIGBsYW5ndWFnZU5hbWVgIFRoZSBuYW1lIG9mIHRoZSBsYW5ndWFnZSB0aGVzZSBvYmplY3RzIGFyZSB3cml0dGVuIGluLlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtBcnJheX0gb2Yge0RlZmluaXRpb259cyB0aGF0IHJlcHJlc2VudGVkIHRoZSBjb252ZXJ0ZWQge0xvY2F0aW9ufXMuXG4gIHB1YmxpYyBzdGF0aWMgY29udmVydExvY2F0aW9uc1RvRGVmaW5pdGlvbnMobG9jYXRpb25zOiBMb2NhdGlvbltdLCBsYW5ndWFnZU5hbWU6IHN0cmluZyk6IGF0b21JZGUuRGVmaW5pdGlvbltdIHtcbiAgICByZXR1cm4gbG9jYXRpb25zLm1hcCgoZCkgPT4gKHtcbiAgICAgIHBhdGg6IENvbnZlcnQudXJpVG9QYXRoKGQudXJpKSxcbiAgICAgIHBvc2l0aW9uOiBDb252ZXJ0LnBvc2l0aW9uVG9Qb2ludChkLnJhbmdlLnN0YXJ0KSxcbiAgICAgIHJhbmdlOiBSYW5nZS5mcm9tT2JqZWN0KENvbnZlcnQubHNSYW5nZVRvQXRvbVJhbmdlKGQucmFuZ2UpKSxcbiAgICAgIGxhbmd1YWdlOiBsYW5ndWFnZU5hbWUsXG4gICAgfSkpO1xuICB9XG59XG4iXX0=
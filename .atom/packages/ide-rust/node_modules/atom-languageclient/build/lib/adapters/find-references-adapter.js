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
// Public: Adapts the language server definition provider to the
// Atom IDE UI Definitions package for 'Go To Definition' functionality.
class FindReferencesAdapter {
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a referencesProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.referencesProvider === true;
    }
    // Public: Get the references for a specific symbol within the document as represented by
    // the {TextEditor} and {Point} within it via the language server.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the references.
    // * `editor` The Atom {TextEditor} containing the text the references should relate to.
    // * `point` The Atom {Point} containing the point within the text the references should relate to.
    //
    // Returns a {Promise} containing a {FindReferencesReturn} with all the references the language server
    // could find.
    getReferences(connection, editor, point, projectRoot) {
        return __awaiter(this, void 0, void 0, function* () {
            const locations = yield connection.findReferences(FindReferencesAdapter.createReferenceParams(editor, point));
            if (locations == null) {
                return null;
            }
            const references = locations.map(FindReferencesAdapter.locationToReference);
            return {
                type: 'data',
                baseUri: projectRoot || '',
                referencedSymbolName: FindReferencesAdapter.getReferencedSymbolName(editor, point, references),
                references,
            };
        });
    }
    // Public: Create a {ReferenceParams} from a given {TextEditor} for a specific {Point}.
    //
    // * `editor` A {TextEditor} that represents the document.
    // * `point` A {Point} within the document.
    //
    // Returns a {ReferenceParams} built from the given parameters.
    static createReferenceParams(editor, point) {
        return {
            textDocument: convert_1.default.editorToTextDocumentIdentifier(editor),
            position: convert_1.default.pointToPosition(point),
            context: { includeDeclaration: true },
        };
    }
    // Public: Convert a {Location} into a {Reference}.
    //
    // * `location` A {Location} to convert.
    //
    // Returns a {Reference} equivalent to the given {Location}.
    static locationToReference(location) {
        return {
            uri: convert_1.default.uriToPath(location.uri),
            name: null,
            range: convert_1.default.lsRangeToAtomRange(location.range),
        };
    }
    // Public: Get a symbol name from a {TextEditor} for a specific {Point} in the document.
    static getReferencedSymbolName(editor, point, references) {
        if (references.length === 0) {
            return '';
        }
        const currentReference = references.find((r) => r.range.containsPoint(point)) || references[0];
        return editor.getBuffer().getTextInRange(currentReference.range);
    }
}
exports.default = FindReferencesAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvZmluZC1yZWZlcmVuY2VzLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQVlqQyxnRUFBZ0U7QUFDaEUsd0VBQXdFO0FBQ3hFLE1BQXFCLHFCQUFxQjtJQUN4QyxnRkFBZ0Y7SUFDaEYsMEVBQTBFO0lBQzFFLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLDJFQUEyRTtJQUMzRSw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxrQkFBa0IsS0FBSyxJQUFJLENBQUM7SUFDeEQsQ0FBQztJQUVELHlGQUF5RjtJQUN6RixrRUFBa0U7SUFDbEUsRUFBRTtJQUNGLDBGQUEwRjtJQUMxRixxQ0FBcUM7SUFDckMsd0ZBQXdGO0lBQ3hGLG1HQUFtRztJQUNuRyxFQUFFO0lBQ0Ysc0dBQXNHO0lBQ3RHLGNBQWM7SUFDRCxhQUFhLENBQ3hCLFVBQW9DLEVBQ3BDLE1BQWtCLEVBQ2xCLEtBQVksRUFDWixXQUEwQjs7WUFFMUIsTUFBTSxTQUFTLEdBQUcsTUFBTSxVQUFVLENBQUMsY0FBYyxDQUMvQyxxQkFBcUIsQ0FBQyxxQkFBcUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQzNELENBQUM7WUFDRixJQUFJLFNBQVMsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLE9BQU8sSUFBSSxDQUFDO2FBQ2I7WUFFRCxNQUFNLFVBQVUsR0FBd0IsU0FBUyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1lBQ2pHLE9BQU87Z0JBQ0wsSUFBSSxFQUFFLE1BQU07Z0JBQ1osT0FBTyxFQUFFLFdBQVcsSUFBSSxFQUFFO2dCQUMxQixvQkFBb0IsRUFBRSxxQkFBcUIsQ0FBQyx1QkFBdUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQztnQkFDOUYsVUFBVTthQUNYLENBQUM7UUFDSixDQUFDO0tBQUE7SUFFRCx1RkFBdUY7SUFDdkYsRUFBRTtJQUNGLDBEQUEwRDtJQUMxRCwyQ0FBMkM7SUFDM0MsRUFBRTtJQUNGLCtEQUErRDtJQUN4RCxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBa0IsRUFBRSxLQUFZO1FBQ2xFLE9BQU87WUFDTCxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUM7WUFDNUQsUUFBUSxFQUFFLGlCQUFPLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQztZQUN4QyxPQUFPLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUU7U0FDdEMsQ0FBQztJQUNKLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsRUFBRTtJQUNGLHdDQUF3QztJQUN4QyxFQUFFO0lBQ0YsNERBQTREO0lBQ3JELE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxRQUFrQjtRQUNsRCxPQUFPO1lBQ0wsR0FBRyxFQUFFLGlCQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDcEMsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsaUJBQU8sQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDO1NBQ2xELENBQUM7SUFDSixDQUFDO0lBRUQsd0ZBQXdGO0lBQ2pGLE1BQU0sQ0FBQyx1QkFBdUIsQ0FDbkMsTUFBa0IsRUFDbEIsS0FBWSxFQUNaLFVBQStCO1FBRS9CLElBQUksVUFBVSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7WUFDM0IsT0FBTyxFQUFFLENBQUM7U0FDWDtRQUNELE1BQU0sZ0JBQWdCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDL0YsT0FBTyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsY0FBYyxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25FLENBQUM7Q0FDRjtBQW5GRCx3Q0FtRkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhdG9tSWRlIGZyb20gJ2F0b20taWRlJztcbmltcG9ydCBDb252ZXJ0IGZyb20gJy4uL2NvbnZlcnQnO1xuaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRFZGl0b3IsXG59IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBMb2NhdGlvbixcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxuICBSZWZlcmVuY2VQYXJhbXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcblxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGxhbmd1YWdlIHNlcnZlciBkZWZpbml0aW9uIHByb3ZpZGVyIHRvIHRoZVxuLy8gQXRvbSBJREUgVUkgRGVmaW5pdGlvbnMgcGFja2FnZSBmb3IgJ0dvIFRvIERlZmluaXRpb24nIGZ1bmN0aW9uYWxpdHkuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBGaW5kUmVmZXJlbmNlc0FkYXB0ZXIge1xuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgcmVmZXJlbmNlc1Byb3ZpZGVyLlxuICAvL1xuICAvLyAqIGBzZXJ2ZXJDYXBhYmlsaXRpZXNgIFRoZSB7U2VydmVyQ2FwYWJpbGl0aWVzfSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRvIGNvbnNpZGVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgYWRhcHRlciBjYW4gYWRhcHQgdGhlIHNlcnZlciBiYXNlZCBvbiB0aGVcbiAgLy8gZ2l2ZW4gc2VydmVyQ2FwYWJpbGl0aWVzLlxuICBwdWJsaWMgc3RhdGljIGNhbkFkYXB0KHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHNlcnZlckNhcGFiaWxpdGllcy5yZWZlcmVuY2VzUHJvdmlkZXIgPT09IHRydWU7XG4gIH1cblxuICAvLyBQdWJsaWM6IEdldCB0aGUgcmVmZXJlbmNlcyBmb3IgYSBzcGVjaWZpYyBzeW1ib2wgd2l0aGluIHRoZSBkb2N1bWVudCBhcyByZXByZXNlbnRlZCBieVxuICAvLyB0aGUge1RleHRFZGl0b3J9IGFuZCB7UG9pbnR9IHdpdGhpbiBpdCB2aWEgdGhlIGxhbmd1YWdlIHNlcnZlci5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSBxdWVyaWVkXG4gIC8vICAgICAgICAgICAgICAgIGZvciB0aGUgcmVmZXJlbmNlcy5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgdGV4dCB0aGUgcmVmZXJlbmNlcyBzaG91bGQgcmVsYXRlIHRvLlxuICAvLyAqIGBwb2ludGAgVGhlIEF0b20ge1BvaW50fSBjb250YWluaW5nIHRoZSBwb2ludCB3aXRoaW4gdGhlIHRleHQgdGhlIHJlZmVyZW5jZXMgc2hvdWxkIHJlbGF0ZSB0by5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtQcm9taXNlfSBjb250YWluaW5nIGEge0ZpbmRSZWZlcmVuY2VzUmV0dXJufSB3aXRoIGFsbCB0aGUgcmVmZXJlbmNlcyB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vIGNvdWxkIGZpbmQuXG4gIHB1YmxpYyBhc3luYyBnZXRSZWZlcmVuY2VzKFxuICAgIGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgICBlZGl0b3I6IFRleHRFZGl0b3IsXG4gICAgcG9pbnQ6IFBvaW50LFxuICAgIHByb2plY3RSb290OiBzdHJpbmcgfCBudWxsLFxuICApOiBQcm9taXNlPGF0b21JZGUuRmluZFJlZmVyZW5jZXNSZXR1cm4gfCBudWxsPiB7XG4gICAgY29uc3QgbG9jYXRpb25zID0gYXdhaXQgY29ubmVjdGlvbi5maW5kUmVmZXJlbmNlcyhcbiAgICAgIEZpbmRSZWZlcmVuY2VzQWRhcHRlci5jcmVhdGVSZWZlcmVuY2VQYXJhbXMoZWRpdG9yLCBwb2ludCksXG4gICAgKTtcbiAgICBpZiAobG9jYXRpb25zID09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHJlZmVyZW5jZXM6IGF0b21JZGUuUmVmZXJlbmNlW10gPSBsb2NhdGlvbnMubWFwKEZpbmRSZWZlcmVuY2VzQWRhcHRlci5sb2NhdGlvblRvUmVmZXJlbmNlKTtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2RhdGEnLFxuICAgICAgYmFzZVVyaTogcHJvamVjdFJvb3QgfHwgJycsXG4gICAgICByZWZlcmVuY2VkU3ltYm9sTmFtZTogRmluZFJlZmVyZW5jZXNBZGFwdGVyLmdldFJlZmVyZW5jZWRTeW1ib2xOYW1lKGVkaXRvciwgcG9pbnQsIHJlZmVyZW5jZXMpLFxuICAgICAgcmVmZXJlbmNlcyxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUgYSB7UmVmZXJlbmNlUGFyYW1zfSBmcm9tIGEgZ2l2ZW4ge1RleHRFZGl0b3J9IGZvciBhIHNwZWNpZmljIHtQb2ludH0uXG4gIC8vXG4gIC8vICogYGVkaXRvcmAgQSB7VGV4dEVkaXRvcn0gdGhhdCByZXByZXNlbnRzIHRoZSBkb2N1bWVudC5cbiAgLy8gKiBgcG9pbnRgIEEge1BvaW50fSB3aXRoaW4gdGhlIGRvY3VtZW50LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1JlZmVyZW5jZVBhcmFtc30gYnVpbHQgZnJvbSB0aGUgZ2l2ZW4gcGFyYW1ldGVycy5cbiAgcHVibGljIHN0YXRpYyBjcmVhdGVSZWZlcmVuY2VQYXJhbXMoZWRpdG9yOiBUZXh0RWRpdG9yLCBwb2ludDogUG9pbnQpOiBSZWZlcmVuY2VQYXJhbXMge1xuICAgIHJldHVybiB7XG4gICAgICB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvciksXG4gICAgICBwb3NpdGlvbjogQ29udmVydC5wb2ludFRvUG9zaXRpb24ocG9pbnQpLFxuICAgICAgY29udGV4dDogeyBpbmNsdWRlRGVjbGFyYXRpb246IHRydWUgfSxcbiAgICB9O1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGEge0xvY2F0aW9ufSBpbnRvIGEge1JlZmVyZW5jZX0uXG4gIC8vXG4gIC8vICogYGxvY2F0aW9uYCBBIHtMb2NhdGlvbn0gdG8gY29udmVydC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtSZWZlcmVuY2V9IGVxdWl2YWxlbnQgdG8gdGhlIGdpdmVuIHtMb2NhdGlvbn0uXG4gIHB1YmxpYyBzdGF0aWMgbG9jYXRpb25Ub1JlZmVyZW5jZShsb2NhdGlvbjogTG9jYXRpb24pOiBhdG9tSWRlLlJlZmVyZW5jZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHVyaTogQ29udmVydC51cmlUb1BhdGgobG9jYXRpb24udXJpKSxcbiAgICAgIG5hbWU6IG51bGwsXG4gICAgICByYW5nZTogQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UobG9jYXRpb24ucmFuZ2UpLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IEdldCBhIHN5bWJvbCBuYW1lIGZyb20gYSB7VGV4dEVkaXRvcn0gZm9yIGEgc3BlY2lmaWMge1BvaW50fSBpbiB0aGUgZG9jdW1lbnQuXG4gIHB1YmxpYyBzdGF0aWMgZ2V0UmVmZXJlbmNlZFN5bWJvbE5hbWUoXG4gICAgZWRpdG9yOiBUZXh0RWRpdG9yLFxuICAgIHBvaW50OiBQb2ludCxcbiAgICByZWZlcmVuY2VzOiBhdG9tSWRlLlJlZmVyZW5jZVtdLFxuICApOiBzdHJpbmcge1xuICAgIGlmIChyZWZlcmVuY2VzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50UmVmZXJlbmNlID0gcmVmZXJlbmNlcy5maW5kKChyKSA9PiByLnJhbmdlLmNvbnRhaW5zUG9pbnQocG9pbnQpKSB8fCByZWZlcmVuY2VzWzBdO1xuICAgIHJldHVybiBlZGl0b3IuZ2V0QnVmZmVyKCkuZ2V0VGV4dEluUmFuZ2UoY3VycmVudFJlZmVyZW5jZS5yYW5nZSk7XG4gIH1cbn1cbiJdfQ==
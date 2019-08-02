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
const assert = require("assert");
const convert_1 = require("../convert");
class CodeHighlightAdapter {
    // Returns a {Boolean} indicating this adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentHighlightProvider === true;
    }
    // Public: Creates highlight markers for a given editor position.
    // Throws an error if documentHighlightProvider is not a registered capability.
    //
    // * `connection` A {LanguageClientConnection} to the language server that provides highlights.
    // * `serverCapabilities` The {ServerCapabilities} of the language server that will be used.
    // * `editor` The Atom {TextEditor} containing the text to be highlighted.
    // * `position` The Atom {Point} to fetch highlights for.
    //
    // Returns a {Promise} of an {Array} of {Range}s to be turned into highlights.
    static highlight(connection, serverCapabilities, editor, position) {
        return __awaiter(this, void 0, void 0, function* () {
            assert(serverCapabilities.documentHighlightProvider, 'Must have the documentHighlight capability');
            const highlights = yield connection.documentHighlight(convert_1.default.editorToTextDocumentPositionParams(editor, position));
            return highlights.map((highlight) => {
                return convert_1.default.lsRangeToAtomRange(highlight.range);
            });
        });
    }
}
exports.default = CodeHighlightAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29kZS1oaWdobGlnaHQtYWRhcHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGFwdGVycy9jb2RlLWhpZ2hsaWdodC1hZGFwdGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxpQ0FBa0M7QUFDbEMsd0NBQWlDO0FBV2pDLE1BQXFCLG9CQUFvQjtJQUN2QyxnRkFBZ0Y7SUFDaEYsNEJBQTRCO0lBQ3JCLE1BQU0sQ0FBQyxRQUFRLENBQUMsa0JBQXNDO1FBQzNELE9BQU8sa0JBQWtCLENBQUMseUJBQXlCLEtBQUssSUFBSSxDQUFDO0lBQy9ELENBQUM7SUFFRCxpRUFBaUU7SUFDakUsK0VBQStFO0lBQy9FLEVBQUU7SUFDRiwrRkFBK0Y7SUFDL0YsNEZBQTRGO0lBQzVGLDBFQUEwRTtJQUMxRSx5REFBeUQ7SUFDekQsRUFBRTtJQUNGLDhFQUE4RTtJQUN2RSxNQUFNLENBQU8sU0FBUyxDQUMzQixVQUFvQyxFQUNwQyxrQkFBc0MsRUFDdEMsTUFBa0IsRUFDbEIsUUFBZTs7WUFFZixNQUFNLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLEVBQUUsNENBQTRDLENBQUMsQ0FBQztZQUNuRyxNQUFNLFVBQVUsR0FBRyxNQUFNLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBTyxDQUFDLGtDQUFrQyxDQUFDLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQ3BILE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsRUFBRSxFQUFFO2dCQUNsQyxPQUFPLGlCQUFPLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3JELENBQUMsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0NBQ0Y7QUE1QkQsdUNBNEJDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQge1xuICBQb2ludCxcbiAgVGV4dEVkaXRvcixcbiAgUmFuZ2UsXG59IGZyb20gJ2F0b20nO1xuaW1wb3J0IHtcbiAgTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICBTZXJ2ZXJDYXBhYmlsaXRpZXMsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQ29kZUhpZ2hsaWdodEFkYXB0ZXIge1xuICAvLyBSZXR1cm5zIGEge0Jvb2xlYW59IGluZGljYXRpbmcgdGhpcyBhZGFwdGVyIGNhbiBhZGFwdCB0aGUgc2VydmVyIGJhc2VkIG9uIHRoZVxuICAvLyBnaXZlbiBzZXJ2ZXJDYXBhYmlsaXRpZXMuXG4gIHB1YmxpYyBzdGF0aWMgY2FuQWRhcHQoc2VydmVyQ2FwYWJpbGl0aWVzOiBTZXJ2ZXJDYXBhYmlsaXRpZXMpOiBib29sZWFuIHtcbiAgICByZXR1cm4gc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIgPT09IHRydWU7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZXMgaGlnaGxpZ2h0IG1hcmtlcnMgZm9yIGEgZ2l2ZW4gZWRpdG9yIHBvc2l0aW9uLlxuICAvLyBUaHJvd3MgYW4gZXJyb3IgaWYgZG9jdW1lbnRIaWdobGlnaHRQcm92aWRlciBpcyBub3QgYSByZWdpc3RlcmVkIGNhcGFiaWxpdHkuXG4gIC8vXG4gIC8vICogYGNvbm5lY3Rpb25gIEEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gdGhlIGxhbmd1YWdlIHNlcnZlciB0aGF0IHByb3ZpZGVzIGhpZ2hsaWdodHMuXG4gIC8vICogYHNlcnZlckNhcGFiaWxpdGllc2AgVGhlIHtTZXJ2ZXJDYXBhYmlsaXRpZXN9IG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgdGhhdCB3aWxsIGJlIHVzZWQuXG4gIC8vICogYGVkaXRvcmAgVGhlIEF0b20ge1RleHRFZGl0b3J9IGNvbnRhaW5pbmcgdGhlIHRleHQgdG8gYmUgaGlnaGxpZ2h0ZWQuXG4gIC8vICogYHBvc2l0aW9uYCBUaGUgQXRvbSB7UG9pbnR9IHRvIGZldGNoIGhpZ2hsaWdodHMgZm9yLlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IG9mIGFuIHtBcnJheX0gb2Yge1JhbmdlfXMgdG8gYmUgdHVybmVkIGludG8gaGlnaGxpZ2h0cy5cbiAgcHVibGljIHN0YXRpYyBhc3luYyBoaWdobGlnaHQoXG4gICAgY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uLFxuICAgIHNlcnZlckNhcGFiaWxpdGllczogU2VydmVyQ2FwYWJpbGl0aWVzLFxuICAgIGVkaXRvcjogVGV4dEVkaXRvcixcbiAgICBwb3NpdGlvbjogUG9pbnQsXG4gICk6IFByb21pc2U8UmFuZ2VbXSB8IG51bGw+IHtcbiAgICBhc3NlcnQoc2VydmVyQ2FwYWJpbGl0aWVzLmRvY3VtZW50SGlnaGxpZ2h0UHJvdmlkZXIsICdNdXN0IGhhdmUgdGhlIGRvY3VtZW50SGlnaGxpZ2h0IGNhcGFiaWxpdHknKTtcbiAgICBjb25zdCBoaWdobGlnaHRzID0gYXdhaXQgY29ubmVjdGlvbi5kb2N1bWVudEhpZ2hsaWdodChDb252ZXJ0LmVkaXRvclRvVGV4dERvY3VtZW50UG9zaXRpb25QYXJhbXMoZWRpdG9yLCBwb3NpdGlvbikpO1xuICAgIHJldHVybiBoaWdobGlnaHRzLm1hcCgoaGlnaGxpZ2h0KSA9PiB7XG4gICAgICByZXR1cm4gQ29udmVydC5sc1JhbmdlVG9BdG9tUmFuZ2UoaGlnaGxpZ2h0LnJhbmdlKTtcbiAgICB9KTtcbiAgfVxufVxuIl19
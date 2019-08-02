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
const languageclient_1 = require("../languageclient");
const atom_1 = require("atom");
// Public: Adapts the documentSymbolProvider of the language server to the Outline View
// supplied by Atom IDE UI.
class OutlineViewAdapter {
    constructor() {
        this._cancellationTokens = new WeakMap();
    }
    // Public: Determine whether this adapter can be used to adapt a language server
    // based on the serverCapabilities matrix containing a documentSymbolProvider.
    //
    // * `serverCapabilities` The {ServerCapabilities} of the language server to consider.
    //
    // Returns a {Boolean} indicating adapter can adapt the server based on the
    // given serverCapabilities.
    static canAdapt(serverCapabilities) {
        return serverCapabilities.documentSymbolProvider === true;
    }
    // Public: Obtain the Outline for document via the {LanguageClientConnection} as identified
    // by the {TextEditor}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will be queried
    //                for the outline.
    // * `editor` The Atom {TextEditor} containing the text the Outline should represent.
    //
    // Returns a {Promise} containing the {Outline} of this document.
    getOutline(connection, editor) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield Utils.doWithCancellationToken(connection, this._cancellationTokens, (cancellationToken) => connection.documentSymbol({ textDocument: convert_1.default.editorToTextDocumentIdentifier(editor) }, cancellationToken));
            if (results.length === 0) {
                return {
                    outlineTrees: [],
                };
            }
            if (results[0].selectionRange !== undefined) {
                // If the server is giving back the newer DocumentSymbol format.
                return {
                    outlineTrees: OutlineViewAdapter.createHierarchicalOutlineTrees(results),
                };
            }
            else {
                // If the server is giving back the original SymbolInformation format.
                return {
                    outlineTrees: OutlineViewAdapter.createOutlineTrees(results),
                };
            }
        });
    }
    // Public: Create an {Array} of {OutlineTree}s from the Array of {DocumentSymbol} recieved
    // from the language server. This includes converting all the children nodes in the entire
    // hierarchy.
    //
    // * `symbols` An {Array} of {DocumentSymbol}s received from the language server that
    //             should be converted to an {Array} of {OutlineTree}.
    //
    // Returns an {Array} of {OutlineTree} containing the given symbols that the Outline View can display.
    static createHierarchicalOutlineTrees(symbols) {
        // Sort all the incoming symbols
        symbols.sort((a, b) => {
            if (a.range.start.line !== b.range.start.line) {
                return a.range.start.line - b.range.start.line;
            }
            if (a.range.start.character !== b.range.start.character) {
                return a.range.start.character - b.range.start.character;
            }
            if (a.range.end.line !== b.range.end.line) {
                return a.range.end.line - b.range.end.line;
            }
            return a.range.end.character - b.range.end.character;
        });
        return symbols.map((symbol) => {
            const tree = OutlineViewAdapter.hierarchicalSymbolToOutline(symbol);
            if (symbol.children != null) {
                tree.children = OutlineViewAdapter.createHierarchicalOutlineTrees(symbol.children);
            }
            return tree;
        });
    }
    // Public: Create an {Array} of {OutlineTree}s from the Array of {SymbolInformation} recieved
    // from the language server. This includes determining the appropriate child and parent
    // relationships for the hierarchy.
    //
    // * `symbols` An {Array} of {SymbolInformation}s received from the language server that
    //             should be converted to an {OutlineTree}.
    //
    // Returns an {OutlineTree} containing the given symbols that the Outline View can display.
    static createOutlineTrees(symbols) {
        symbols.sort((a, b) => (a.location.range.start.line === b.location.range.start.line
            ? a.location.range.start.character - b.location.range.start.character
            : a.location.range.start.line - b.location.range.start.line));
        // Temporarily keep containerName through the conversion process
        // Also filter out symbols without a name - it's part of the spec but some don't include it
        const allItems = symbols.filter((symbol) => symbol.name).map((symbol) => ({
            containerName: symbol.containerName,
            outline: OutlineViewAdapter.symbolToOutline(symbol),
        }));
        // Create a map of containers by name with all items that have that name
        const containers = allItems.reduce((map, item) => {
            const name = item.outline.representativeName;
            if (name != null) {
                const container = map.get(name);
                if (container == null) {
                    map.set(name, [item.outline]);
                }
                else {
                    container.push(item.outline);
                }
            }
            return map;
        }, new Map());
        const roots = [];
        // Put each item within its parent and extract out the roots
        for (const item of allItems) {
            const containerName = item.containerName;
            const child = item.outline;
            if (containerName == null || containerName === '') {
                roots.push(item.outline);
            }
            else {
                const possibleParents = containers.get(containerName);
                let closestParent = OutlineViewAdapter._getClosestParent(possibleParents, child);
                if (closestParent == null) {
                    closestParent = {
                        plainText: containerName,
                        representativeName: containerName,
                        startPosition: new atom_1.Point(0, 0),
                        children: [child],
                    };
                    roots.push(closestParent);
                    if (possibleParents == null) {
                        containers.set(containerName, [closestParent]);
                    }
                    else {
                        possibleParents.push(closestParent);
                    }
                }
                else {
                    closestParent.children.push(child);
                }
            }
        }
        return roots;
    }
    static _getClosestParent(candidates, child) {
        if (candidates == null || candidates.length === 0) {
            return null;
        }
        let parent;
        for (const candidate of candidates) {
            if (candidate !== child &&
                candidate.startPosition.isLessThanOrEqual(child.startPosition) &&
                (candidate.endPosition === undefined ||
                    (child.endPosition && candidate.endPosition.isGreaterThanOrEqual(child.endPosition)))) {
                if (parent === undefined ||
                    (parent.startPosition.isLessThanOrEqual(candidate.startPosition) ||
                        (parent.endPosition != null &&
                            candidate.endPosition &&
                            parent.endPosition.isGreaterThanOrEqual(candidate.endPosition)))) {
                    parent = candidate;
                }
            }
        }
        return parent || null;
    }
    // Public: Convert an individual {DocumentSymbol} from the language server
    // to an {OutlineTree} for use by the Outline View. It does NOT recursively
    // process the given symbol's children (if any).
    //
    // * `symbol` The {DocumentSymbol} to convert to an {OutlineTree}.
    //
    // Returns the {OutlineTree} corresponding to the given {DocumentSymbol}.
    static hierarchicalSymbolToOutline(symbol) {
        const icon = OutlineViewAdapter.symbolKindToEntityKind(symbol.kind);
        return {
            tokenizedText: [
                {
                    kind: OutlineViewAdapter.symbolKindToTokenKind(symbol.kind),
                    value: symbol.name,
                },
            ],
            icon: icon != null ? icon : undefined,
            representativeName: symbol.name,
            startPosition: convert_1.default.positionToPoint(symbol.selectionRange.start),
            endPosition: convert_1.default.positionToPoint(symbol.selectionRange.end),
            children: [],
        };
    }
    // Public: Convert an individual {SymbolInformation} from the language server
    // to an {OutlineTree} for use by the Outline View.
    //
    // * `symbol` The {SymbolInformation} to convert to an {OutlineTree}.
    //
    // Returns the {OutlineTree} equivalent to the given {SymbolInformation}.
    static symbolToOutline(symbol) {
        const icon = OutlineViewAdapter.symbolKindToEntityKind(symbol.kind);
        return {
            tokenizedText: [
                {
                    kind: OutlineViewAdapter.symbolKindToTokenKind(symbol.kind),
                    value: symbol.name,
                },
            ],
            icon: icon != null ? icon : undefined,
            representativeName: symbol.name,
            startPosition: convert_1.default.positionToPoint(symbol.location.range.start),
            endPosition: convert_1.default.positionToPoint(symbol.location.range.end),
            children: [],
        };
    }
    // Public: Convert a symbol kind into an outline entity kind used to determine
    // the styling such as the appropriate icon in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent OutlineView entity kind.
    static symbolKindToEntityKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Array:
                return 'type-array';
            case languageclient_1.SymbolKind.Boolean:
                return 'type-boolean';
            case languageclient_1.SymbolKind.Class:
                return 'type-class';
            case languageclient_1.SymbolKind.Constant:
                return 'type-constant';
            case languageclient_1.SymbolKind.Constructor:
                return 'type-constructor';
            case languageclient_1.SymbolKind.Enum:
                return 'type-enum';
            case languageclient_1.SymbolKind.Field:
                return 'type-field';
            case languageclient_1.SymbolKind.File:
                return 'type-file';
            case languageclient_1.SymbolKind.Function:
                return 'type-function';
            case languageclient_1.SymbolKind.Interface:
                return 'type-interface';
            case languageclient_1.SymbolKind.Method:
                return 'type-method';
            case languageclient_1.SymbolKind.Module:
                return 'type-module';
            case languageclient_1.SymbolKind.Namespace:
                return 'type-namespace';
            case languageclient_1.SymbolKind.Number:
                return 'type-number';
            case languageclient_1.SymbolKind.Package:
                return 'type-package';
            case languageclient_1.SymbolKind.Property:
                return 'type-property';
            case languageclient_1.SymbolKind.String:
                return 'type-string';
            case languageclient_1.SymbolKind.Variable:
                return 'type-variable';
            case languageclient_1.SymbolKind.Struct:
                return 'type-class';
            case languageclient_1.SymbolKind.EnumMember:
                return 'type-constant';
            default:
                return null;
        }
    }
    // Public: Convert a symbol kind to the appropriate token kind used to syntax
    // highlight the symbol name in the Outline View.
    //
    // * `symbol` The numeric symbol kind received from the language server.
    //
    // Returns a string representing the equivalent syntax token kind.
    static symbolKindToTokenKind(symbol) {
        switch (symbol) {
            case languageclient_1.SymbolKind.Class:
                return 'type';
            case languageclient_1.SymbolKind.Constructor:
                return 'constructor';
            case languageclient_1.SymbolKind.Method:
            case languageclient_1.SymbolKind.Function:
                return 'method';
            case languageclient_1.SymbolKind.String:
                return 'string';
            default:
                return 'plain';
        }
    }
}
exports.default = OutlineViewAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0bGluZS12aWV3LWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvb3V0bGluZS12aWV3LWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLHdDQUFpQztBQUNqQyxrQ0FBa0M7QUFFbEMsc0RBTTJCO0FBQzNCLCtCQUdjO0FBRWQsdUZBQXVGO0FBQ3ZGLDJCQUEyQjtBQUMzQixNQUFxQixrQkFBa0I7SUFBdkM7UUFFVSx3QkFBbUIsR0FBK0QsSUFBSSxPQUFPLEVBQUUsQ0FBQztJQW9UMUcsQ0FBQztJQWxUQyxnRkFBZ0Y7SUFDaEYsOEVBQThFO0lBQzlFLEVBQUU7SUFDRixzRkFBc0Y7SUFDdEYsRUFBRTtJQUNGLDJFQUEyRTtJQUMzRSw0QkFBNEI7SUFDckIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxrQkFBc0M7UUFDM0QsT0FBTyxrQkFBa0IsQ0FBQyxzQkFBc0IsS0FBSyxJQUFJLENBQUM7SUFDNUQsQ0FBQztJQUVELDJGQUEyRjtJQUMzRix1QkFBdUI7SUFDdkIsRUFBRTtJQUNGLDBGQUEwRjtJQUMxRixrQ0FBa0M7SUFDbEMscUZBQXFGO0lBQ3JGLEVBQUU7SUFDRixpRUFBaUU7SUFDcEQsVUFBVSxDQUFDLFVBQW9DLEVBQUUsTUFBa0I7O1lBQzlFLE1BQU0sT0FBTyxHQUFHLE1BQU0sS0FBSyxDQUFDLHVCQUF1QixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQzlHLFVBQVUsQ0FBQyxjQUFjLENBQUMsRUFBRSxZQUFZLEVBQUUsaUJBQU8sQ0FBQyw4QkFBOEIsQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLGlCQUFpQixDQUFDLENBQy9HLENBQUM7WUFFRixJQUFJLE9BQU8sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO2dCQUN4QixPQUFPO29CQUNMLFlBQVksRUFBRSxFQUFFO2lCQUNqQixD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TUFBTTtnQkFDcEIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLE9BQU87Z0JBQ3JCLE9BQU8sY0FBYyxDQUFDO1lBQ3hCLEtBQUssMkJBQVUsQ0FBQyxRQUFRO2dCQUN0QixPQUFPLGVBQWUsQ0FBQztZQUN6QixLQUFLLDJCQUFVLENBQUMsTUFBTTtnQkFDcEIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLFFBQVE7Z0JBQ3RCLE9BQU8sZUFBZSxDQUFDO1lBQ3pCLEtBQUssMkJBQVUsQ0FBQyxNQUFNO2dCQUNwQixPQUFPLFlBQVksQ0FBQztZQUN0QixLQUFLLDJCQUFVLENBQUMsVUFBVTtnQkFDeEIsT0FBTyxlQUFlLENBQUM7WUFDekI7Z0JBQ0UsT0FBTyxJQUFJLENBQUM7U0FDZjtJQUNILENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsaURBQWlEO0lBQ2pELEVBQUU7SUFDRix3RUFBd0U7SUFDeEUsRUFBRTtJQUNGLGtFQUFrRTtJQUMzRCxNQUFNLENBQUMscUJBQXFCLENBQUMsTUFBYztRQUNoRCxRQUFRLE1BQU0sRUFBRTtZQUNkLEtBQUssMkJBQVUsQ0FBQyxLQUFLO2dCQUNuQixPQUFPLE1BQU0sQ0FBQztZQUNoQixLQUFLLDJCQUFVLENBQUMsV0FBVztnQkFDekIsT0FBTyxhQUFhLENBQUM7WUFDdkIsS0FBSywyQkFBVSxDQUFDLE1BQU0sQ0FBQztZQUN2QixLQUFLLDJCQUFVLENBQUMsUUFBUTtnQkFDdEIsT0FBTyxRQUFRLENBQUM7WUFDbEIsS0FBSywyQkFBVSxDQUFDLE1BQU07Z0JBQ3BCLE9BQU8sUUFBUSxDQUFDO1lBQ2xCO2dCQUNFLE9BQU8sT0FBTyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztDQUNGO0FBdFRELHFDQXNUQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF0b21JZGUgZnJvbSAnYXRvbS1pZGUnO1xuaW1wb3J0IENvbnZlcnQgZnJvbSAnLi4vY29udmVydCc7XG5pbXBvcnQgKiBhcyBVdGlscyBmcm9tICcuLi91dGlscyc7XG5pbXBvcnQgeyBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSB9IGZyb20gJ3ZzY29kZS1qc29ucnBjJztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgU3ltYm9sS2luZCxcbiAgU2VydmVyQ2FwYWJpbGl0aWVzLFxuICBTeW1ib2xJbmZvcm1hdGlvbixcbiAgRG9jdW1lbnRTeW1ib2wsXG59IGZyb20gJy4uL2xhbmd1YWdlY2xpZW50JztcbmltcG9ydCB7XG4gIFBvaW50LFxuICBUZXh0RWRpdG9yLFxufSBmcm9tICdhdG9tJztcblxuLy8gUHVibGljOiBBZGFwdHMgdGhlIGRvY3VtZW50U3ltYm9sUHJvdmlkZXIgb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byB0aGUgT3V0bGluZSBWaWV3XG4vLyBzdXBwbGllZCBieSBBdG9tIElERSBVSS5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE91dGxpbmVWaWV3QWRhcHRlciB7XG5cbiAgcHJpdmF0ZSBfY2FuY2VsbGF0aW9uVG9rZW5zOiBXZWFrTWFwPExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbiwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+ID0gbmV3IFdlYWtNYXAoKTtcblxuICAvLyBQdWJsaWM6IERldGVybWluZSB3aGV0aGVyIHRoaXMgYWRhcHRlciBjYW4gYmUgdXNlZCB0byBhZGFwdCBhIGxhbmd1YWdlIHNlcnZlclxuICAvLyBiYXNlZCBvbiB0aGUgc2VydmVyQ2FwYWJpbGl0aWVzIG1hdHJpeCBjb250YWluaW5nIGEgZG9jdW1lbnRTeW1ib2xQcm92aWRlci5cbiAgLy9cbiAgLy8gKiBgc2VydmVyQ2FwYWJpbGl0aWVzYCBUaGUge1NlcnZlckNhcGFiaWxpdGllc30gb2YgdGhlIGxhbmd1YWdlIHNlcnZlciB0byBjb25zaWRlci5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtCb29sZWFufSBpbmRpY2F0aW5nIGFkYXB0ZXIgY2FuIGFkYXB0IHRoZSBzZXJ2ZXIgYmFzZWQgb24gdGhlXG4gIC8vIGdpdmVuIHNlcnZlckNhcGFiaWxpdGllcy5cbiAgcHVibGljIHN0YXRpYyBjYW5BZGFwdChzZXJ2ZXJDYXBhYmlsaXRpZXM6IFNlcnZlckNhcGFiaWxpdGllcyk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBzZXJ2ZXJDYXBhYmlsaXRpZXMuZG9jdW1lbnRTeW1ib2xQcm92aWRlciA9PT0gdHJ1ZTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogT2J0YWluIHRoZSBPdXRsaW5lIGZvciBkb2N1bWVudCB2aWEgdGhlIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IGFzIGlkZW50aWZpZWRcbiAgLy8gYnkgdGhlIHtUZXh0RWRpdG9yfS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBiZSBxdWVyaWVkXG4gIC8vICAgICAgICAgICAgICAgIGZvciB0aGUgb3V0bGluZS5cbiAgLy8gKiBgZWRpdG9yYCBUaGUgQXRvbSB7VGV4dEVkaXRvcn0gY29udGFpbmluZyB0aGUgdGV4dCB0aGUgT3V0bGluZSBzaG91bGQgcmVwcmVzZW50LlxuICAvL1xuICAvLyBSZXR1cm5zIGEge1Byb21pc2V9IGNvbnRhaW5pbmcgdGhlIHtPdXRsaW5lfSBvZiB0aGlzIGRvY3VtZW50LlxuICBwdWJsaWMgYXN5bmMgZ2V0T3V0bGluZShjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sIGVkaXRvcjogVGV4dEVkaXRvcik6IFByb21pc2U8YXRvbUlkZS5PdXRsaW5lIHwgbnVsbD4ge1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBVdGlscy5kb1dpdGhDYW5jZWxsYXRpb25Ub2tlbihjb25uZWN0aW9uLCB0aGlzLl9jYW5jZWxsYXRpb25Ub2tlbnMsIChjYW5jZWxsYXRpb25Ub2tlbikgPT5cbiAgICAgIGNvbm5lY3Rpb24uZG9jdW1lbnRTeW1ib2woeyB0ZXh0RG9jdW1lbnQ6IENvbnZlcnQuZWRpdG9yVG9UZXh0RG9jdW1lbnRJZGVudGlmaWVyKGVkaXRvcikgfSwgY2FuY2VsbGF0aW9uVG9rZW4pLFxuICAgICk7XG5cbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG91dGxpbmVUcmVlczogW10sXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICgocmVzdWx0c1swXSBhcyBEb2N1bWVudFN5bWJvbCkuc2VsZWN0aW9uUmFuZ2UgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gSWYgdGhlIHNlcnZlciBpcyBnaXZpbmcgYmFjayB0aGUgbmV3ZXIgRG9jdW1lbnRTeW1ib2wgZm9ybWF0LlxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb3V0bGluZVRyZWVzOiBPdXRsaW5lVmlld0FkYXB0ZXIuY3JlYXRlSGllcmFyY2hpY2FsT3V0bGluZVRyZWVzKFxuICAgICAgICAgIHJlc3VsdHMgYXMgRG9jdW1lbnRTeW1ib2xbXSksXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBJZiB0aGUgc2VydmVyIGlzIGdpdmluZyBiYWNrIHRoZSBvcmlnaW5hbCBTeW1ib2xJbmZvcm1hdGlvbiBmb3JtYXQuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBvdXRsaW5lVHJlZXM6IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVPdXRsaW5lVHJlZXMoXG4gICAgICAgICAgcmVzdWx0cyBhcyBTeW1ib2xJbmZvcm1hdGlvbltdKSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgLy8gUHVibGljOiBDcmVhdGUgYW4ge0FycmF5fSBvZiB7T3V0bGluZVRyZWV9cyBmcm9tIHRoZSBBcnJheSBvZiB7RG9jdW1lbnRTeW1ib2x9IHJlY2lldmVkXG4gIC8vIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlci4gVGhpcyBpbmNsdWRlcyBjb252ZXJ0aW5nIGFsbCB0aGUgY2hpbGRyZW4gbm9kZXMgaW4gdGhlIGVudGlyZVxuICAvLyBoaWVyYXJjaHkuXG4gIC8vXG4gIC8vICogYHN5bWJvbHNgIEFuIHtBcnJheX0gb2Yge0RvY3VtZW50U3ltYm9sfXMgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXRcbiAgLy8gICAgICAgICAgICAgc2hvdWxkIGJlIGNvbnZlcnRlZCB0byBhbiB7QXJyYXl9IG9mIHtPdXRsaW5lVHJlZX0uXG4gIC8vXG4gIC8vIFJldHVybnMgYW4ge0FycmF5fSBvZiB7T3V0bGluZVRyZWV9IGNvbnRhaW5pbmcgdGhlIGdpdmVuIHN5bWJvbHMgdGhhdCB0aGUgT3V0bGluZSBWaWV3IGNhbiBkaXNwbGF5LlxuICBwdWJsaWMgc3RhdGljIGNyZWF0ZUhpZXJhcmNoaWNhbE91dGxpbmVUcmVlcyhzeW1ib2xzOiBEb2N1bWVudFN5bWJvbFtdKTogYXRvbUlkZS5PdXRsaW5lVHJlZVtdIHtcbiAgICAvLyBTb3J0IGFsbCB0aGUgaW5jb21pbmcgc3ltYm9sc1xuICAgIHN5bWJvbHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgaWYgKGEucmFuZ2Uuc3RhcnQubGluZSAhPT0gYi5yYW5nZS5zdGFydC5saW5lKSB7XG4gICAgICAgIHJldHVybiBhLnJhbmdlLnN0YXJ0LmxpbmUgLSBiLnJhbmdlLnN0YXJ0LmxpbmU7XG4gICAgICB9XG5cbiAgICAgIGlmIChhLnJhbmdlLnN0YXJ0LmNoYXJhY3RlciAhPT0gYi5yYW5nZS5zdGFydC5jaGFyYWN0ZXIpIHtcbiAgICAgICAgcmV0dXJuIGEucmFuZ2Uuc3RhcnQuY2hhcmFjdGVyIC0gYi5yYW5nZS5zdGFydC5jaGFyYWN0ZXI7XG4gICAgICB9XG5cbiAgICAgIGlmIChhLnJhbmdlLmVuZC5saW5lICE9PSBiLnJhbmdlLmVuZC5saW5lKSB7XG4gICAgICAgIHJldHVybiBhLnJhbmdlLmVuZC5saW5lIC0gYi5yYW5nZS5lbmQubGluZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGEucmFuZ2UuZW5kLmNoYXJhY3RlciAtIGIucmFuZ2UuZW5kLmNoYXJhY3RlcjtcbiAgICB9KTtcblxuICAgIHJldHVybiBzeW1ib2xzLm1hcCgoc3ltYm9sKSA9PiB7XG4gICAgICBjb25zdCB0cmVlID0gT3V0bGluZVZpZXdBZGFwdGVyLmhpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZShzeW1ib2wpO1xuXG4gICAgICBpZiAoc3ltYm9sLmNoaWxkcmVuICE9IG51bGwpIHtcbiAgICAgICAgdHJlZS5jaGlsZHJlbiA9IE91dGxpbmVWaWV3QWRhcHRlci5jcmVhdGVIaWVyYXJjaGljYWxPdXRsaW5lVHJlZXMoXG4gICAgICAgICAgc3ltYm9sLmNoaWxkcmVuKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRyZWU7XG4gICAgfSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENyZWF0ZSBhbiB7QXJyYXl9IG9mIHtPdXRsaW5lVHJlZX1zIGZyb20gdGhlIEFycmF5IG9mIHtTeW1ib2xJbmZvcm1hdGlvbn0gcmVjaWV2ZWRcbiAgLy8gZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLiBUaGlzIGluY2x1ZGVzIGRldGVybWluaW5nIHRoZSBhcHByb3ByaWF0ZSBjaGlsZCBhbmQgcGFyZW50XG4gIC8vIHJlbGF0aW9uc2hpcHMgZm9yIHRoZSBoaWVyYXJjaHkuXG4gIC8vXG4gIC8vICogYHN5bWJvbHNgIEFuIHtBcnJheX0gb2Yge1N5bWJvbEluZm9ybWF0aW9ufXMgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXRcbiAgLy8gICAgICAgICAgICAgc2hvdWxkIGJlIGNvbnZlcnRlZCB0byBhbiB7T3V0bGluZVRyZWV9LlxuICAvL1xuICAvLyBSZXR1cm5zIGFuIHtPdXRsaW5lVHJlZX0gY29udGFpbmluZyB0aGUgZ2l2ZW4gc3ltYm9scyB0aGF0IHRoZSBPdXRsaW5lIFZpZXcgY2FuIGRpc3BsYXkuXG4gIHB1YmxpYyBzdGF0aWMgY3JlYXRlT3V0bGluZVRyZWVzKHN5bWJvbHM6IFN5bWJvbEluZm9ybWF0aW9uW10pOiBhdG9tSWRlLk91dGxpbmVUcmVlW10ge1xuICAgIHN5bWJvbHMuc29ydChcbiAgICAgIChhLCBiKSA9PlxuICAgICAgICAoYS5sb2NhdGlvbi5yYW5nZS5zdGFydC5saW5lID09PSBiLmxvY2F0aW9uLnJhbmdlLnN0YXJ0LmxpbmVcbiAgICAgICAgICA/IGEubG9jYXRpb24ucmFuZ2Uuc3RhcnQuY2hhcmFjdGVyIC0gYi5sb2NhdGlvbi5yYW5nZS5zdGFydC5jaGFyYWN0ZXJcbiAgICAgICAgICA6IGEubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSAtIGIubG9jYXRpb24ucmFuZ2Uuc3RhcnQubGluZSksXG4gICAgKTtcblxuICAgIC8vIFRlbXBvcmFyaWx5IGtlZXAgY29udGFpbmVyTmFtZSB0aHJvdWdoIHRoZSBjb252ZXJzaW9uIHByb2Nlc3NcbiAgICAvLyBBbHNvIGZpbHRlciBvdXQgc3ltYm9scyB3aXRob3V0IGEgbmFtZSAtIGl0J3MgcGFydCBvZiB0aGUgc3BlYyBidXQgc29tZSBkb24ndCBpbmNsdWRlIGl0XG4gICAgY29uc3QgYWxsSXRlbXMgPSBzeW1ib2xzLmZpbHRlcigoc3ltYm9sKSA9PiBzeW1ib2wubmFtZSkubWFwKChzeW1ib2wpID0+ICh7XG4gICAgICBjb250YWluZXJOYW1lOiBzeW1ib2wuY29udGFpbmVyTmFtZSxcbiAgICAgIG91dGxpbmU6IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xUb091dGxpbmUoc3ltYm9sKSxcbiAgICB9KSk7XG5cbiAgICAvLyBDcmVhdGUgYSBtYXAgb2YgY29udGFpbmVycyBieSBuYW1lIHdpdGggYWxsIGl0ZW1zIHRoYXQgaGF2ZSB0aGF0IG5hbWVcbiAgICBjb25zdCBjb250YWluZXJzID0gYWxsSXRlbXMucmVkdWNlKChtYXAsIGl0ZW0pID0+IHtcbiAgICAgIGNvbnN0IG5hbWUgPSBpdGVtLm91dGxpbmUucmVwcmVzZW50YXRpdmVOYW1lO1xuICAgICAgaWYgKG5hbWUgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBjb250YWluZXIgPSBtYXAuZ2V0KG5hbWUpO1xuICAgICAgICBpZiAoY29udGFpbmVyID09IG51bGwpIHtcbiAgICAgICAgICBtYXAuc2V0KG5hbWUsIFtpdGVtLm91dGxpbmVdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjb250YWluZXIucHVzaChpdGVtLm91dGxpbmUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFwO1xuICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICBjb25zdCByb290czogYXRvbUlkZS5PdXRsaW5lVHJlZVtdID0gW107XG5cbiAgICAvLyBQdXQgZWFjaCBpdGVtIHdpdGhpbiBpdHMgcGFyZW50IGFuZCBleHRyYWN0IG91dCB0aGUgcm9vdHNcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgYWxsSXRlbXMpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lck5hbWUgPSBpdGVtLmNvbnRhaW5lck5hbWU7XG4gICAgICBjb25zdCBjaGlsZCA9IGl0ZW0ub3V0bGluZTtcbiAgICAgIGlmIChjb250YWluZXJOYW1lID09IG51bGwgfHwgY29udGFpbmVyTmFtZSA9PT0gJycpIHtcbiAgICAgICAgcm9vdHMucHVzaChpdGVtLm91dGxpbmUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcG9zc2libGVQYXJlbnRzID0gY29udGFpbmVycy5nZXQoY29udGFpbmVyTmFtZSk7XG4gICAgICAgIGxldCBjbG9zZXN0UGFyZW50ID0gT3V0bGluZVZpZXdBZGFwdGVyLl9nZXRDbG9zZXN0UGFyZW50KHBvc3NpYmxlUGFyZW50cywgY2hpbGQpO1xuICAgICAgICBpZiAoY2xvc2VzdFBhcmVudCA9PSBudWxsKSB7XG4gICAgICAgICAgY2xvc2VzdFBhcmVudCA9IHtcbiAgICAgICAgICAgIHBsYWluVGV4dDogY29udGFpbmVyTmFtZSxcbiAgICAgICAgICAgIHJlcHJlc2VudGF0aXZlTmFtZTogY29udGFpbmVyTmFtZSxcbiAgICAgICAgICAgIHN0YXJ0UG9zaXRpb246IG5ldyBQb2ludCgwLCAwKSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbY2hpbGRdLFxuICAgICAgICAgIH07XG4gICAgICAgICAgcm9vdHMucHVzaChjbG9zZXN0UGFyZW50KTtcbiAgICAgICAgICBpZiAocG9zc2libGVQYXJlbnRzID09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnRhaW5lcnMuc2V0KGNvbnRhaW5lck5hbWUsIFtjbG9zZXN0UGFyZW50XSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHBvc3NpYmxlUGFyZW50cy5wdXNoKGNsb3Nlc3RQYXJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjbG9zZXN0UGFyZW50LmNoaWxkcmVuLnB1c2goY2hpbGQpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHJvb3RzO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgX2dldENsb3Nlc3RQYXJlbnQoXG4gICAgY2FuZGlkYXRlczogYXRvbUlkZS5PdXRsaW5lVHJlZVtdIHwgbnVsbCxcbiAgICBjaGlsZDogYXRvbUlkZS5PdXRsaW5lVHJlZSxcbiAgKTogYXRvbUlkZS5PdXRsaW5lVHJlZSB8IG51bGwge1xuICAgIGlmIChjYW5kaWRhdGVzID09IG51bGwgfHwgY2FuZGlkYXRlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGxldCBwYXJlbnQ6IGF0b21JZGUuT3V0bGluZVRyZWUgfCB1bmRlZmluZWQ7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgY2FuZGlkYXRlcykge1xuICAgICAgaWYgKFxuICAgICAgICBjYW5kaWRhdGUgIT09IGNoaWxkICYmXG4gICAgICAgIGNhbmRpZGF0ZS5zdGFydFBvc2l0aW9uLmlzTGVzc1RoYW5PckVxdWFsKGNoaWxkLnN0YXJ0UG9zaXRpb24pICYmXG4gICAgICAgIChjYW5kaWRhdGUuZW5kUG9zaXRpb24gPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgIChjaGlsZC5lbmRQb3NpdGlvbiAmJiBjYW5kaWRhdGUuZW5kUG9zaXRpb24uaXNHcmVhdGVyVGhhbk9yRXF1YWwoY2hpbGQuZW5kUG9zaXRpb24pKSlcbiAgICAgICkge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgcGFyZW50ID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgICAocGFyZW50LnN0YXJ0UG9zaXRpb24uaXNMZXNzVGhhbk9yRXF1YWwoY2FuZGlkYXRlLnN0YXJ0UG9zaXRpb24pIHx8XG4gICAgICAgICAgICAocGFyZW50LmVuZFBvc2l0aW9uICE9IG51bGwgJiZcbiAgICAgICAgICAgICAgY2FuZGlkYXRlLmVuZFBvc2l0aW9uICYmXG4gICAgICAgICAgICAgIHBhcmVudC5lbmRQb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChjYW5kaWRhdGUuZW5kUG9zaXRpb24pKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcGFyZW50ID0gY2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhcmVudCB8fCBudWxsO1xuICB9XG5cbiAgLy8gUHVibGljOiBDb252ZXJ0IGFuIGluZGl2aWR1YWwge0RvY3VtZW50U3ltYm9sfSBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gdG8gYW4ge091dGxpbmVUcmVlfSBmb3IgdXNlIGJ5IHRoZSBPdXRsaW5lIFZpZXcuIEl0IGRvZXMgTk9UIHJlY3Vyc2l2ZWx5XG4gIC8vIHByb2Nlc3MgdGhlIGdpdmVuIHN5bWJvbCdzIGNoaWxkcmVuIChpZiBhbnkpLlxuICAvL1xuICAvLyAqIGBzeW1ib2xgIFRoZSB7RG9jdW1lbnRTeW1ib2x9IHRvIGNvbnZlcnQgdG8gYW4ge091dGxpbmVUcmVlfS5cbiAgLy9cbiAgLy8gUmV0dXJucyB0aGUge091dGxpbmVUcmVlfSBjb3JyZXNwb25kaW5nIHRvIHRoZSBnaXZlbiB7RG9jdW1lbnRTeW1ib2x9LlxuICBwdWJsaWMgc3RhdGljIGhpZXJhcmNoaWNhbFN5bWJvbFRvT3V0bGluZShzeW1ib2w6IERvY3VtZW50U3ltYm9sKTogYXRvbUlkZS5PdXRsaW5lVHJlZSB7XG4gICAgY29uc3QgaWNvbiA9IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xLaW5kVG9FbnRpdHlLaW5kKHN5bWJvbC5raW5kKTtcblxuICAgIHJldHVybiB7XG4gICAgICB0b2tlbml6ZWRUZXh0OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBraW5kOiBPdXRsaW5lVmlld0FkYXB0ZXIuc3ltYm9sS2luZFRvVG9rZW5LaW5kKHN5bWJvbC5raW5kKSxcbiAgICAgICAgICB2YWx1ZTogc3ltYm9sLm5hbWUsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgaWNvbjogaWNvbiAhPSBudWxsID8gaWNvbiA6IHVuZGVmaW5lZCxcbiAgICAgIHJlcHJlc2VudGF0aXZlTmFtZTogc3ltYm9sLm5hbWUsXG4gICAgICBzdGFydFBvc2l0aW9uOiBDb252ZXJ0LnBvc2l0aW9uVG9Qb2ludChzeW1ib2wuc2VsZWN0aW9uUmFuZ2Uuc3RhcnQpLFxuICAgICAgZW5kUG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHN5bWJvbC5zZWxlY3Rpb25SYW5nZS5lbmQpLFxuICAgICAgY2hpbGRyZW46IFtdLFxuICAgIH07XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYW4gaW5kaXZpZHVhbCB7U3ltYm9sSW5mb3JtYXRpb259IGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyB0byBhbiB7T3V0bGluZVRyZWV9IGZvciB1c2UgYnkgdGhlIE91dGxpbmUgVmlldy5cbiAgLy9cbiAgLy8gKiBgc3ltYm9sYCBUaGUge1N5bWJvbEluZm9ybWF0aW9ufSB0byBjb252ZXJ0IHRvIGFuIHtPdXRsaW5lVHJlZX0uXG4gIC8vXG4gIC8vIFJldHVybnMgdGhlIHtPdXRsaW5lVHJlZX0gZXF1aXZhbGVudCB0byB0aGUgZ2l2ZW4ge1N5bWJvbEluZm9ybWF0aW9ufS5cbiAgcHVibGljIHN0YXRpYyBzeW1ib2xUb091dGxpbmUoc3ltYm9sOiBTeW1ib2xJbmZvcm1hdGlvbik6IGF0b21JZGUuT3V0bGluZVRyZWUge1xuICAgIGNvbnN0IGljb24gPSBPdXRsaW5lVmlld0FkYXB0ZXIuc3ltYm9sS2luZFRvRW50aXR5S2luZChzeW1ib2wua2luZCk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRva2VuaXplZFRleHQ6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtpbmQ6IE91dGxpbmVWaWV3QWRhcHRlci5zeW1ib2xLaW5kVG9Ub2tlbktpbmQoc3ltYm9sLmtpbmQpLFxuICAgICAgICAgIHZhbHVlOiBzeW1ib2wubmFtZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBpY29uOiBpY29uICE9IG51bGwgPyBpY29uIDogdW5kZWZpbmVkLFxuICAgICAgcmVwcmVzZW50YXRpdmVOYW1lOiBzeW1ib2wubmFtZSxcbiAgICAgIHN0YXJ0UG9zaXRpb246IENvbnZlcnQucG9zaXRpb25Ub1BvaW50KHN5bWJvbC5sb2NhdGlvbi5yYW5nZS5zdGFydCksXG4gICAgICBlbmRQb3NpdGlvbjogQ29udmVydC5wb3NpdGlvblRvUG9pbnQoc3ltYm9sLmxvY2F0aW9uLnJhbmdlLmVuZCksXG4gICAgICBjaGlsZHJlbjogW10sXG4gICAgfTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQ29udmVydCBhIHN5bWJvbCBraW5kIGludG8gYW4gb3V0bGluZSBlbnRpdHkga2luZCB1c2VkIHRvIGRldGVybWluZVxuICAvLyB0aGUgc3R5bGluZyBzdWNoIGFzIHRoZSBhcHByb3ByaWF0ZSBpY29uIGluIHRoZSBPdXRsaW5lIFZpZXcuXG4gIC8vXG4gIC8vICogYHN5bWJvbGAgVGhlIG51bWVyaWMgc3ltYm9sIGtpbmQgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXF1aXZhbGVudCBPdXRsaW5lVmlldyBlbnRpdHkga2luZC5cbiAgcHVibGljIHN0YXRpYyBzeW1ib2xLaW5kVG9FbnRpdHlLaW5kKHN5bWJvbDogbnVtYmVyKTogc3RyaW5nIHwgbnVsbCB7XG4gICAgc3dpdGNoIChzeW1ib2wpIHtcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5BcnJheTpcbiAgICAgICAgcmV0dXJuICd0eXBlLWFycmF5JztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5Cb29sZWFuOlxuICAgICAgICByZXR1cm4gJ3R5cGUtYm9vbGVhbic7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ2xhc3M6XG4gICAgICAgIHJldHVybiAndHlwZS1jbGFzcyc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ29uc3RhbnQ6XG4gICAgICAgIHJldHVybiAndHlwZS1jb25zdGFudCc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuQ29uc3RydWN0b3I6XG4gICAgICAgIHJldHVybiAndHlwZS1jb25zdHJ1Y3Rvcic7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuRW51bTpcbiAgICAgICAgcmV0dXJuICd0eXBlLWVudW0nO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkZpZWxkOlxuICAgICAgICByZXR1cm4gJ3R5cGUtZmllbGQnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkZpbGU6XG4gICAgICAgIHJldHVybiAndHlwZS1maWxlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5GdW5jdGlvbjpcbiAgICAgICAgcmV0dXJuICd0eXBlLWZ1bmN0aW9uJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5JbnRlcmZhY2U6XG4gICAgICAgIHJldHVybiAndHlwZS1pbnRlcmZhY2UnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLk1ldGhvZDpcbiAgICAgICAgcmV0dXJuICd0eXBlLW1ldGhvZCc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuTW9kdWxlOlxuICAgICAgICByZXR1cm4gJ3R5cGUtbW9kdWxlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5OYW1lc3BhY2U6XG4gICAgICAgIHJldHVybiAndHlwZS1uYW1lc3BhY2UnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLk51bWJlcjpcbiAgICAgICAgcmV0dXJuICd0eXBlLW51bWJlcic7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuUGFja2FnZTpcbiAgICAgICAgcmV0dXJuICd0eXBlLXBhY2thZ2UnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLlByb3BlcnR5OlxuICAgICAgICByZXR1cm4gJ3R5cGUtcHJvcGVydHknO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLlN0cmluZzpcbiAgICAgICAgcmV0dXJuICd0eXBlLXN0cmluZyc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuVmFyaWFibGU6XG4gICAgICAgIHJldHVybiAndHlwZS12YXJpYWJsZSc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuU3RydWN0OlxuICAgICAgICByZXR1cm4gJ3R5cGUtY2xhc3MnO1xuICAgICAgY2FzZSBTeW1ib2xLaW5kLkVudW1NZW1iZXI6XG4gICAgICAgIHJldHVybiAndHlwZS1jb25zdGFudCc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSBzeW1ib2wga2luZCB0byB0aGUgYXBwcm9wcmlhdGUgdG9rZW4ga2luZCB1c2VkIHRvIHN5bnRheFxuICAvLyBoaWdobGlnaHQgdGhlIHN5bWJvbCBuYW1lIGluIHRoZSBPdXRsaW5lIFZpZXcuXG4gIC8vXG4gIC8vICogYHN5bWJvbGAgVGhlIG51bWVyaWMgc3ltYm9sIGtpbmQgcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyLlxuICAvL1xuICAvLyBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGluZyB0aGUgZXF1aXZhbGVudCBzeW50YXggdG9rZW4ga2luZC5cbiAgcHVibGljIHN0YXRpYyBzeW1ib2xLaW5kVG9Ub2tlbktpbmQoc3ltYm9sOiBudW1iZXIpOiBhdG9tSWRlLlRva2VuS2luZCB7XG4gICAgc3dpdGNoIChzeW1ib2wpIHtcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5DbGFzczpcbiAgICAgICAgcmV0dXJuICd0eXBlJztcbiAgICAgIGNhc2UgU3ltYm9sS2luZC5Db25zdHJ1Y3RvcjpcbiAgICAgICAgcmV0dXJuICdjb25zdHJ1Y3Rvcic7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuTWV0aG9kOlxuICAgICAgY2FzZSBTeW1ib2xLaW5kLkZ1bmN0aW9uOlxuICAgICAgICByZXR1cm4gJ21ldGhvZCc7XG4gICAgICBjYXNlIFN5bWJvbEtpbmQuU3RyaW5nOlxuICAgICAgICByZXR1cm4gJ3N0cmluZyc7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gJ3BsYWluJztcbiAgICB9XG4gIH1cbn1cbiJdfQ==
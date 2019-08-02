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
const atom_1 = require("atom");
const vscode_jsonrpc_1 = require("vscode-jsonrpc");
/**
 * Obtain the range of the word at the given editor position.
 * Uses the non-word characters from the position's grammar scope.
 */
function getWordAtPosition(editor, position) {
    const nonWordCharacters = escapeRegExp(editor.getNonWordCharacters(position));
    const range = _getRegexpRangeAtPosition(editor.getBuffer(), position, new RegExp(`^[\t ]*$|[^\\s${nonWordCharacters}]+`, 'g'));
    if (range == null) {
        return new atom_1.Range(position, position);
    }
    return range;
}
exports.getWordAtPosition = getWordAtPosition;
function escapeRegExp(string) {
    // From atom/underscore-plus.
    return string.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}
exports.escapeRegExp = escapeRegExp;
function _getRegexpRangeAtPosition(buffer, position, wordRegex) {
    const { row, column } = position;
    const rowRange = buffer.rangeForRow(row, false);
    let matchData;
    // Extract the expression from the row text.
    buffer.scanInRange(wordRegex, rowRange, (data) => {
        const { range } = data;
        if (position.isGreaterThanOrEqual(range.start) &&
            // Range endpoints are exclusive.
            position.isLessThan(range.end)) {
            matchData = data;
            data.stop();
            return;
        }
        // Stop the scan if the scanner has passed our position.
        if (range.end.column > column) {
            data.stop();
        }
    });
    return matchData == null ? null : matchData.range;
}
/**
 * For the given connection and cancellationTokens map, cancel the existing
 * CancellationToken for that connection then create and store a new
 * CancellationToken to be used for the current request.
 */
function cancelAndRefreshCancellationToken(key, cancellationTokens) {
    let cancellationToken = cancellationTokens.get(key);
    if (cancellationToken !== undefined && !cancellationToken.token.isCancellationRequested) {
        cancellationToken.cancel();
    }
    cancellationToken = new vscode_jsonrpc_1.CancellationTokenSource();
    cancellationTokens.set(key, cancellationToken);
    return cancellationToken.token;
}
exports.cancelAndRefreshCancellationToken = cancelAndRefreshCancellationToken;
function doWithCancellationToken(key, cancellationTokens, work) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = cancelAndRefreshCancellationToken(key, cancellationTokens);
        const result = yield work(token);
        cancellationTokens.delete(key);
        return result;
    });
}
exports.doWithCancellationToken = doWithCancellationToken;
function assertUnreachable(_) {
    return _;
}
exports.assertUnreachable = assertUnreachable;
function promiseWithTimeout(ms, promise) {
    return new Promise((resolve, reject) => {
        // create a timeout to reject promise if not resolved
        const timer = setTimeout(() => {
            reject(new Error(`Timeout after ${ms}ms`));
        }, ms);
        promise.then((res) => {
            clearTimeout(timer);
            resolve(res);
        }).catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
exports.promiseWithTimeout = promiseWithTimeout;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLCtCQU1jO0FBQ2QsbURBR3dCO0FBT3hCOzs7R0FHRztBQUNILFNBQWdCLGlCQUFpQixDQUFDLE1BQWtCLEVBQUUsUUFBZTtJQUNuRSxNQUFNLGlCQUFpQixHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztJQUM5RSxNQUFNLEtBQUssR0FBRyx5QkFBeUIsQ0FDckMsTUFBTSxDQUFDLFNBQVMsRUFBRSxFQUNsQixRQUFRLEVBQ1IsSUFBSSxNQUFNLENBQUMsaUJBQWlCLGlCQUFpQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQ3hELENBQUM7SUFDRixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsT0FBTyxJQUFJLFlBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDdEM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFYRCw4Q0FXQztBQUVELFNBQWdCLFlBQVksQ0FBQyxNQUFjO0lBQ3pDLDZCQUE2QjtJQUM3QixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUMsdUJBQXVCLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUhELG9DQUdDO0FBRUQsU0FBUyx5QkFBeUIsQ0FBQyxNQUFrQixFQUFFLFFBQWUsRUFBRSxTQUFpQjtJQUN2RixNQUFNLEVBQUUsR0FBRyxFQUFFLE1BQU0sRUFBRSxHQUFHLFFBQVEsQ0FBQztJQUNqQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNoRCxJQUFJLFNBQThDLENBQUM7SUFDbkQsNENBQTRDO0lBQzVDLE1BQU0sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxDQUFDLElBQUksRUFBRSxFQUFFO1FBQy9DLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUM7UUFDdkIsSUFDRSxRQUFRLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUMxQyxpQ0FBaUM7WUFDakMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQzlCO1lBQ0EsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNqQixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDWixPQUFPO1NBQ1I7UUFDRCx3REFBd0Q7UUFDeEQsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLEVBQUU7WUFDN0IsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ2I7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUNILE9BQU8sU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO0FBQ3BELENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBZ0IsaUNBQWlDLENBQy9DLEdBQU0sRUFDTixrQkFBdUQ7SUFFdkQsSUFBSSxpQkFBaUIsR0FBRyxrQkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDcEQsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsdUJBQXVCLEVBQUU7UUFDdkYsaUJBQWlCLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDNUI7SUFFRCxpQkFBaUIsR0FBRyxJQUFJLHdDQUF1QixFQUFFLENBQUM7SUFDbEQsa0JBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0lBQy9DLE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDO0FBQ2pDLENBQUM7QUFaRCw4RUFZQztBQUVELFNBQXNCLHVCQUF1QixDQUMzQyxHQUFPLEVBQ1Asa0JBQXdELEVBQ3hELElBQStDOztRQUUvQyxNQUFNLEtBQUssR0FBRyxpQ0FBaUMsQ0FBQyxHQUFHLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztRQUN6RSxNQUFNLE1BQU0sR0FBTyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDL0IsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUFBO0FBVEQsMERBU0M7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxDQUFRO0lBQ3hDLE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUZELDhDQUVDO0FBRUQsU0FBZ0Isa0JBQWtCLENBQUksRUFBVSxFQUFFLE9BQW1CO0lBQ25FLE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7UUFDckMscURBQXFEO1FBQ3JELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDNUIsTUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDN0MsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRVAsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ25CLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUNmLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDZCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQWZELGdEQWVDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgUG9pbnQsXG4gIFRleHRCdWZmZXIsXG4gIFRleHRFZGl0b3IsXG4gIFJhbmdlLFxuICBCdWZmZXJTY2FuUmVzdWx0LFxufSBmcm9tICdhdG9tJztcbmltcG9ydCB7XG4gIENhbmNlbGxhdGlvblRva2VuLFxuICBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSxcbn0gZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuXG5leHBvcnQgdHlwZSBSZXBvcnRCdXN5V2hpbGUgPSA8VD4oXG4gIHRpdGxlOiBzdHJpbmcsXG4gIGY6ICgpID0+IFByb21pc2U8VD4sXG4pID0+IFByb21pc2U8VD47XG5cbi8qKlxuICogT2J0YWluIHRoZSByYW5nZSBvZiB0aGUgd29yZCBhdCB0aGUgZ2l2ZW4gZWRpdG9yIHBvc2l0aW9uLlxuICogVXNlcyB0aGUgbm9uLXdvcmQgY2hhcmFjdGVycyBmcm9tIHRoZSBwb3NpdGlvbidzIGdyYW1tYXIgc2NvcGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRXb3JkQXRQb3NpdGlvbihlZGl0b3I6IFRleHRFZGl0b3IsIHBvc2l0aW9uOiBQb2ludCk6IFJhbmdlIHtcbiAgY29uc3Qgbm9uV29yZENoYXJhY3RlcnMgPSBlc2NhcGVSZWdFeHAoZWRpdG9yLmdldE5vbldvcmRDaGFyYWN0ZXJzKHBvc2l0aW9uKSk7XG4gIGNvbnN0IHJhbmdlID0gX2dldFJlZ2V4cFJhbmdlQXRQb3NpdGlvbihcbiAgICBlZGl0b3IuZ2V0QnVmZmVyKCksXG4gICAgcG9zaXRpb24sXG4gICAgbmV3IFJlZ0V4cChgXltcXHQgXSokfFteXFxcXHMke25vbldvcmRDaGFyYWN0ZXJzfV0rYCwgJ2cnKSxcbiAgKTtcbiAgaWYgKHJhbmdlID09IG51bGwpIHtcbiAgICByZXR1cm4gbmV3IFJhbmdlKHBvc2l0aW9uLCBwb3NpdGlvbik7XG4gIH1cbiAgcmV0dXJuIHJhbmdlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXNjYXBlUmVnRXhwKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgLy8gRnJvbSBhdG9tL3VuZGVyc2NvcmUtcGx1cy5cbiAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLS9cXFxcXiQqKz8uKCl8W1xcXXt9XS9nLCAnXFxcXCQmJyk7XG59XG5cbmZ1bmN0aW9uIF9nZXRSZWdleHBSYW5nZUF0UG9zaXRpb24oYnVmZmVyOiBUZXh0QnVmZmVyLCBwb3NpdGlvbjogUG9pbnQsIHdvcmRSZWdleDogUmVnRXhwKTogUmFuZ2UgfCBudWxsIHtcbiAgY29uc3QgeyByb3csIGNvbHVtbiB9ID0gcG9zaXRpb247XG4gIGNvbnN0IHJvd1JhbmdlID0gYnVmZmVyLnJhbmdlRm9yUm93KHJvdywgZmFsc2UpO1xuICBsZXQgbWF0Y2hEYXRhOiBCdWZmZXJTY2FuUmVzdWx0IHwgdW5kZWZpbmVkIHwgbnVsbDtcbiAgLy8gRXh0cmFjdCB0aGUgZXhwcmVzc2lvbiBmcm9tIHRoZSByb3cgdGV4dC5cbiAgYnVmZmVyLnNjYW5JblJhbmdlKHdvcmRSZWdleCwgcm93UmFuZ2UsIChkYXRhKSA9PiB7XG4gICAgY29uc3QgeyByYW5nZSB9ID0gZGF0YTtcbiAgICBpZiAoXG4gICAgICBwb3NpdGlvbi5pc0dyZWF0ZXJUaGFuT3JFcXVhbChyYW5nZS5zdGFydCkgJiZcbiAgICAgIC8vIFJhbmdlIGVuZHBvaW50cyBhcmUgZXhjbHVzaXZlLlxuICAgICAgcG9zaXRpb24uaXNMZXNzVGhhbihyYW5nZS5lbmQpXG4gICAgKSB7XG4gICAgICBtYXRjaERhdGEgPSBkYXRhO1xuICAgICAgZGF0YS5zdG9wKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFN0b3AgdGhlIHNjYW4gaWYgdGhlIHNjYW5uZXIgaGFzIHBhc3NlZCBvdXIgcG9zaXRpb24uXG4gICAgaWYgKHJhbmdlLmVuZC5jb2x1bW4gPiBjb2x1bW4pIHtcbiAgICAgIGRhdGEuc3RvcCgpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBtYXRjaERhdGEgPT0gbnVsbCA/IG51bGwgOiBtYXRjaERhdGEucmFuZ2U7XG59XG5cbi8qKlxuICogRm9yIHRoZSBnaXZlbiBjb25uZWN0aW9uIGFuZCBjYW5jZWxsYXRpb25Ub2tlbnMgbWFwLCBjYW5jZWwgdGhlIGV4aXN0aW5nXG4gKiBDYW5jZWxsYXRpb25Ub2tlbiBmb3IgdGhhdCBjb25uZWN0aW9uIHRoZW4gY3JlYXRlIGFuZCBzdG9yZSBhIG5ld1xuICogQ2FuY2VsbGF0aW9uVG9rZW4gdG8gYmUgdXNlZCBmb3IgdGhlIGN1cnJlbnQgcmVxdWVzdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbmNlbEFuZFJlZnJlc2hDYW5jZWxsYXRpb25Ub2tlbjxUIGV4dGVuZHMgb2JqZWN0PihcbiAga2V5OiBULFxuICBjYW5jZWxsYXRpb25Ub2tlbnM6IFdlYWtNYXA8VCwgQ2FuY2VsbGF0aW9uVG9rZW5Tb3VyY2U+KTogQ2FuY2VsbGF0aW9uVG9rZW4ge1xuXG4gIGxldCBjYW5jZWxsYXRpb25Ub2tlbiA9IGNhbmNlbGxhdGlvblRva2Vucy5nZXQoa2V5KTtcbiAgaWYgKGNhbmNlbGxhdGlvblRva2VuICE9PSB1bmRlZmluZWQgJiYgIWNhbmNlbGxhdGlvblRva2VuLnRva2VuLmlzQ2FuY2VsbGF0aW9uUmVxdWVzdGVkKSB7XG4gICAgY2FuY2VsbGF0aW9uVG9rZW4uY2FuY2VsKCk7XG4gIH1cblxuICBjYW5jZWxsYXRpb25Ub2tlbiA9IG5ldyBDYW5jZWxsYXRpb25Ub2tlblNvdXJjZSgpO1xuICBjYW5jZWxsYXRpb25Ub2tlbnMuc2V0KGtleSwgY2FuY2VsbGF0aW9uVG9rZW4pO1xuICByZXR1cm4gY2FuY2VsbGF0aW9uVG9rZW4udG9rZW47XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb1dpdGhDYW5jZWxsYXRpb25Ub2tlbjxUMSBleHRlbmRzIG9iamVjdCwgVDI+KFxuICBrZXk6IFQxLFxuICBjYW5jZWxsYXRpb25Ub2tlbnM6IFdlYWtNYXA8VDEsIENhbmNlbGxhdGlvblRva2VuU291cmNlPixcbiAgd29yazogKHRva2VuOiBDYW5jZWxsYXRpb25Ub2tlbikgPT4gUHJvbWlzZTxUMj4sXG4pOiBQcm9taXNlPFQyPiB7XG4gIGNvbnN0IHRva2VuID0gY2FuY2VsQW5kUmVmcmVzaENhbmNlbGxhdGlvblRva2VuKGtleSwgY2FuY2VsbGF0aW9uVG9rZW5zKTtcbiAgY29uc3QgcmVzdWx0OiBUMiA9IGF3YWl0IHdvcmsodG9rZW4pO1xuICBjYW5jZWxsYXRpb25Ub2tlbnMuZGVsZXRlKGtleSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRVbnJlYWNoYWJsZShfOiBuZXZlcik6IG5ldmVyIHtcbiAgcmV0dXJuIF87XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9taXNlV2l0aFRpbWVvdXQ8VD4obXM6IG51bWJlciwgcHJvbWlzZTogUHJvbWlzZTxUPik6IFByb21pc2U8VD4ge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIC8vIGNyZWF0ZSBhIHRpbWVvdXQgdG8gcmVqZWN0IHByb21pc2UgaWYgbm90IHJlc29sdmVkXG4gICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHJlamVjdChuZXcgRXJyb3IoYFRpbWVvdXQgYWZ0ZXIgJHttc31tc2ApKTtcbiAgICB9LCBtcyk7XG5cbiAgICBwcm9taXNlLnRoZW4oKHJlcykgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgIHJlc29sdmUocmVzKTtcbiAgICB9KS5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgcmVqZWN0KGVycik7XG4gICAgfSk7XG4gIH0pO1xufVxuIl19
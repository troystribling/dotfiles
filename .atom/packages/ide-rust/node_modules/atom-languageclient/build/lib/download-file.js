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
const fs = require("fs");
// Public: Download a file and store it on a file system using streaming with appropriate progress callback.
//
// * `sourceUrl`        Url to download from.
// * `targetFile`       File path to save to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
// * `length`           File length in bytes if you want percentage progress indication and the server is
//                      unable to provide a Content-Length header and whitelist CORS access via a
//                      `Access-Control-Expose-Headers "content-length"` header.
//
// Returns a {Promise} that will accept when complete.
exports.default = (function downloadFile(sourceUrl, targetFile, progressCallback, length) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = new Request(sourceUrl, {
            headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
        });
        const response = yield fetch(request);
        if (!response.ok) {
            throw Error(`Unable to download, server returned ${response.status} ${response.statusText}`);
        }
        const body = response.body;
        if (body == null) {
            throw Error('No response body');
        }
        const finalLength = length || parseInt(response.headers.get('Content-Length') || '0', 10);
        const reader = body.getReader();
        const writer = fs.createWriteStream(targetFile);
        yield streamWithProgress(finalLength, reader, writer, progressCallback);
        writer.end();
    });
});
// Stream from a {ReadableStreamReader} to a {WriteStream} with progress callback.
//
// * `length`           File length in bytes.
// * `reader`           {ReadableStreamReader} to read from.
// * `writer`           {WriteStream} to write to.
// * `progressCallback` Callback function that will be given a {ByteProgressCallback} object containing
//                      both bytesDone and percent.
//
// Returns a {Promise} that will accept when complete.
function streamWithProgress(length, reader, writer, progressCallback) {
    return __awaiter(this, void 0, void 0, function* () {
        let bytesDone = 0;
        while (true) {
            const result = yield reader.read();
            if (result.done) {
                if (progressCallback != null) {
                    progressCallback(length, 100);
                }
                return;
            }
            const chunk = result.value;
            if (chunk == null) {
                throw Error('Empty chunk received during download');
            }
            else {
                writer.write(Buffer.from(chunk));
                if (progressCallback != null) {
                    bytesDone += chunk.byteLength;
                    const percent = length === 0 ? undefined : Math.floor(bytesDone / length * 100);
                    progressCallback(bytesDone, percent);
                }
            }
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG93bmxvYWQtZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9kb3dubG9hZC1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSx5QkFBeUI7QUFFekIsNEdBQTRHO0FBQzVHLEVBQUU7QUFDRiw2Q0FBNkM7QUFDN0MsNkNBQTZDO0FBQzdDLHVHQUF1RztBQUN2RyxtREFBbUQ7QUFDbkQseUdBQXlHO0FBQ3pHLGlHQUFpRztBQUNqRyxnRkFBZ0Y7QUFDaEYsRUFBRTtBQUNGLHNEQUFzRDtBQUN0RCxrQkFBZSxDQUFDLFNBQWUsWUFBWSxDQUN6QyxTQUFpQixFQUNqQixVQUFrQixFQUNsQixnQkFBdUMsRUFDdkMsTUFBZTs7UUFFZixNQUFNLE9BQU8sR0FBRyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDckMsT0FBTyxFQUFFLElBQUksT0FBTyxDQUFDLEVBQUUsY0FBYyxFQUFFLDBCQUEwQixFQUFFLENBQUM7U0FDckUsQ0FBQyxDQUFDO1FBRUgsTUFBTSxRQUFRLEdBQUcsTUFBTSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDdEMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLEVBQUU7WUFDaEIsTUFBTSxLQUFLLENBQUMsdUNBQXVDLFFBQVEsQ0FBQyxNQUFNLElBQUksUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7U0FDOUY7UUFFRCxNQUFNLElBQUksR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQzNCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtZQUNoQixNQUFNLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFJLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztRQUMxRixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDaEMsTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWhELE1BQU0sa0JBQWtCLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RSxNQUFNLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDZixDQUFDO0NBQUEsQ0FBQyxDQUFDO0FBRUgsa0ZBQWtGO0FBQ2xGLEVBQUU7QUFDRiw2Q0FBNkM7QUFDN0MsNERBQTREO0FBQzVELGtEQUFrRDtBQUNsRCx1R0FBdUc7QUFDdkcsbURBQW1EO0FBQ25ELEVBQUU7QUFDRixzREFBc0Q7QUFDdEQsU0FBZSxrQkFBa0IsQ0FDL0IsTUFBYyxFQUNkLE1BQTRCLEVBQzVCLE1BQXNCLEVBQ3RCLGdCQUF1Qzs7UUFFdkMsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBRWxCLE9BQU8sSUFBSSxFQUFFO1lBQ1gsTUFBTSxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbkMsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFO2dCQUNmLElBQUksZ0JBQWdCLElBQUksSUFBSSxFQUFFO29CQUM1QixnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQy9CO2dCQUNELE9BQU87YUFDUjtZQUVELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUM7WUFDM0IsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUNqQixNQUFNLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO2FBQ3JEO2lCQUFNO2dCQUNMLE1BQU0sQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUNqQyxJQUFJLGdCQUFnQixJQUFJLElBQUksRUFBRTtvQkFDNUIsU0FBUyxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUM7b0JBQzlCLE1BQU0sT0FBTyxHQUF1QixNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztvQkFDcEcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2lCQUN0QzthQUNGO1NBQ0Y7SUFDSCxDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5cbi8vIFB1YmxpYzogRG93bmxvYWQgYSBmaWxlIGFuZCBzdG9yZSBpdCBvbiBhIGZpbGUgc3lzdGVtIHVzaW5nIHN0cmVhbWluZyB3aXRoIGFwcHJvcHJpYXRlIHByb2dyZXNzIGNhbGxiYWNrLlxuLy9cbi8vICogYHNvdXJjZVVybGAgICAgICAgIFVybCB0byBkb3dubG9hZCBmcm9tLlxuLy8gKiBgdGFyZ2V0RmlsZWAgICAgICAgRmlsZSBwYXRoIHRvIHNhdmUgdG8uXG4vLyAqIGBwcm9ncmVzc0NhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZ2l2ZW4gYSB7Qnl0ZVByb2dyZXNzQ2FsbGJhY2t9IG9iamVjdCBjb250YWluaW5nXG4vLyAgICAgICAgICAgICAgICAgICAgICBib3RoIGJ5dGVzRG9uZSBhbmQgcGVyY2VudC5cbi8vICogYGxlbmd0aGAgICAgICAgICAgIEZpbGUgbGVuZ3RoIGluIGJ5dGVzIGlmIHlvdSB3YW50IHBlcmNlbnRhZ2UgcHJvZ3Jlc3MgaW5kaWNhdGlvbiBhbmQgdGhlIHNlcnZlciBpc1xuLy8gICAgICAgICAgICAgICAgICAgICAgdW5hYmxlIHRvIHByb3ZpZGUgYSBDb250ZW50LUxlbmd0aCBoZWFkZXIgYW5kIHdoaXRlbGlzdCBDT1JTIGFjY2VzcyB2aWEgYVxuLy8gICAgICAgICAgICAgICAgICAgICAgYEFjY2Vzcy1Db250cm9sLUV4cG9zZS1IZWFkZXJzIFwiY29udGVudC1sZW5ndGhcImAgaGVhZGVyLlxuLy9cbi8vIFJldHVybnMgYSB7UHJvbWlzZX0gdGhhdCB3aWxsIGFjY2VwdCB3aGVuIGNvbXBsZXRlLlxuZXhwb3J0IGRlZmF1bHQgKGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkRmlsZShcbiAgc291cmNlVXJsOiBzdHJpbmcsXG4gIHRhcmdldEZpbGU6IHN0cmluZyxcbiAgcHJvZ3Jlc3NDYWxsYmFjaz86IEJ5dGVQcm9ncmVzc0NhbGxiYWNrLFxuICBsZW5ndGg/OiBudW1iZXIsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KHNvdXJjZVVybCwge1xuICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW0nIH0pLFxuICB9KTtcblxuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKHJlcXVlc3QpO1xuICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgdGhyb3cgRXJyb3IoYFVuYWJsZSB0byBkb3dubG9hZCwgc2VydmVyIHJldHVybmVkICR7cmVzcG9uc2Uuc3RhdHVzfSAke3Jlc3BvbnNlLnN0YXR1c1RleHR9YCk7XG4gIH1cblxuICBjb25zdCBib2R5ID0gcmVzcG9uc2UuYm9keTtcbiAgaWYgKGJvZHkgPT0gbnVsbCkge1xuICAgIHRocm93IEVycm9yKCdObyByZXNwb25zZSBib2R5Jyk7XG4gIH1cblxuICBjb25zdCBmaW5hbExlbmd0aCA9IGxlbmd0aCB8fCBwYXJzZUludChyZXNwb25zZS5oZWFkZXJzLmdldCgnQ29udGVudC1MZW5ndGgnKSB8fCAnMCcsIDEwKTtcbiAgY29uc3QgcmVhZGVyID0gYm9keS5nZXRSZWFkZXIoKTtcbiAgY29uc3Qgd3JpdGVyID0gZnMuY3JlYXRlV3JpdGVTdHJlYW0odGFyZ2V0RmlsZSk7XG5cbiAgYXdhaXQgc3RyZWFtV2l0aFByb2dyZXNzKGZpbmFsTGVuZ3RoLCByZWFkZXIsIHdyaXRlciwgcHJvZ3Jlc3NDYWxsYmFjayk7XG4gIHdyaXRlci5lbmQoKTtcbn0pO1xuXG4vLyBTdHJlYW0gZnJvbSBhIHtSZWFkYWJsZVN0cmVhbVJlYWRlcn0gdG8gYSB7V3JpdGVTdHJlYW19IHdpdGggcHJvZ3Jlc3MgY2FsbGJhY2suXG4vL1xuLy8gKiBgbGVuZ3RoYCAgICAgICAgICAgRmlsZSBsZW5ndGggaW4gYnl0ZXMuXG4vLyAqIGByZWFkZXJgICAgICAgICAgICB7UmVhZGFibGVTdHJlYW1SZWFkZXJ9IHRvIHJlYWQgZnJvbS5cbi8vICogYHdyaXRlcmAgICAgICAgICAgIHtXcml0ZVN0cmVhbX0gdG8gd3JpdGUgdG8uXG4vLyAqIGBwcm9ncmVzc0NhbGxiYWNrYCBDYWxsYmFjayBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgZ2l2ZW4gYSB7Qnl0ZVByb2dyZXNzQ2FsbGJhY2t9IG9iamVjdCBjb250YWluaW5nXG4vLyAgICAgICAgICAgICAgICAgICAgICBib3RoIGJ5dGVzRG9uZSBhbmQgcGVyY2VudC5cbi8vXG4vLyBSZXR1cm5zIGEge1Byb21pc2V9IHRoYXQgd2lsbCBhY2NlcHQgd2hlbiBjb21wbGV0ZS5cbmFzeW5jIGZ1bmN0aW9uIHN0cmVhbVdpdGhQcm9ncmVzcyhcbiAgbGVuZ3RoOiBudW1iZXIsXG4gIHJlYWRlcjogUmVhZGFibGVTdHJlYW1SZWFkZXIsXG4gIHdyaXRlcjogZnMuV3JpdGVTdHJlYW0sXG4gIHByb2dyZXNzQ2FsbGJhY2s/OiBCeXRlUHJvZ3Jlc3NDYWxsYmFjayxcbik6IFByb21pc2U8dm9pZD4ge1xuICBsZXQgYnl0ZXNEb25lID0gMDtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHJlYWRlci5yZWFkKCk7XG4gICAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgICBpZiAocHJvZ3Jlc3NDYWxsYmFjayAhPSBudWxsKSB7XG4gICAgICAgIHByb2dyZXNzQ2FsbGJhY2sobGVuZ3RoLCAxMDApO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNodW5rID0gcmVzdWx0LnZhbHVlO1xuICAgIGlmIChjaHVuayA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBFcnJvcignRW1wdHkgY2h1bmsgcmVjZWl2ZWQgZHVyaW5nIGRvd25sb2FkJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdyaXRlci53cml0ZShCdWZmZXIuZnJvbShjaHVuaykpO1xuICAgICAgaWYgKHByb2dyZXNzQ2FsbGJhY2sgIT0gbnVsbCkge1xuICAgICAgICBieXRlc0RvbmUgKz0gY2h1bmsuYnl0ZUxlbmd0aDtcbiAgICAgICAgY29uc3QgcGVyY2VudDogbnVtYmVyIHwgdW5kZWZpbmVkID0gbGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogTWF0aC5mbG9vcihieXRlc0RvbmUgLyBsZW5ndGggKiAxMDApO1xuICAgICAgICBwcm9ncmVzc0NhbGxiYWNrKGJ5dGVzRG9uZSwgcGVyY2VudCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIFB1YmxpYzogUHJvZ3Jlc3MgY2FsbGJhY2sgZnVuY3Rpb24gc2lnbmF0dXJlIGluZGljYXRpbmcgdGhlIGJ5dGVzRG9uZSBhbmRcbi8vIG9wdGlvbmFsIHBlcmNlbnRhZ2Ugd2hlbiBsZW5ndGggaXMga25vd24uXG5leHBvcnQgdHlwZSBCeXRlUHJvZ3Jlc3NDYWxsYmFjayA9IChieXRlc0RvbmU6IG51bWJlciwgcGVyY2VudD86IG51bWJlcikgPT4gdm9pZDtcbiJdfQ==
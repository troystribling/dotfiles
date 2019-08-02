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
// Public: Adapts workspace/applyEdit commands to editors.
class ApplyEditAdapter {
    // Public: Attach to a {LanguageClientConnection} to receive edit events.
    static attach(connection) {
        connection.onApplyEdit((m) => ApplyEditAdapter.onApplyEdit(m));
    }
    /**
     * Tries to apply edits and reverts if anything goes wrong.
     * Returns the checkpoint, so the caller can revert changes if needed.
     */
    static applyEdits(buffer, edits) {
        const checkpoint = buffer.createCheckpoint();
        try {
            // Sort edits in reverse order to prevent edit conflicts.
            edits.sort((edit1, edit2) => -edit1.oldRange.compare(edit2.oldRange));
            edits.reduce((previous, current) => {
                ApplyEditAdapter.validateEdit(buffer, current, previous);
                buffer.setTextInRange(current.oldRange, current.newText);
                return current;
            }, null);
            buffer.groupChangesSinceCheckpoint(checkpoint);
            return checkpoint;
        }
        catch (err) {
            buffer.revertToCheckpoint(checkpoint);
            throw err;
        }
    }
    static onApplyEdit(params) {
        return __awaiter(this, void 0, void 0, function* () {
            let changes = params.edit.changes || {};
            if (params.edit.documentChanges) {
                changes = {};
                params.edit.documentChanges.forEach((change) => {
                    if (change && change.textDocument) {
                        changes[change.textDocument.uri] = change.edits;
                    }
                });
            }
            const uris = Object.keys(changes);
            // Keep checkpoints from all successful buffer edits
            const checkpoints = [];
            const promises = uris.map((uri) => __awaiter(this, void 0, void 0, function* () {
                const path = convert_1.default.uriToPath(uri);
                const editor = yield atom.workspace.open(path, {
                    searchAllPanes: true,
                    // Open new editors in the background.
                    activatePane: false,
                    activateItem: false,
                });
                const buffer = editor.getBuffer();
                // Get an existing editor for the file, or open a new one if it doesn't exist.
                const edits = convert_1.default.convertLsTextEdits(changes[uri]);
                const checkpoint = ApplyEditAdapter.applyEdits(buffer, edits);
                checkpoints.push({ buffer, checkpoint });
            }));
            // Apply all edits or fail and revert everything
            const applied = yield Promise.all(promises)
                .then(() => true)
                .catch((err) => {
                atom.notifications.addError('workspace/applyEdits failed', {
                    description: 'Failed to apply edits.',
                    detail: err.message,
                });
                checkpoints.forEach(({ buffer, checkpoint }) => {
                    buffer.revertToCheckpoint(checkpoint);
                });
                return false;
            });
            return { applied };
        });
    }
    // Private: Do some basic sanity checking on the edit ranges.
    static validateEdit(buffer, edit, prevEdit) {
        const path = buffer.getPath() || '';
        if (prevEdit && edit.oldRange.end.compare(prevEdit.oldRange.start) > 0) {
            throw Error(`Found overlapping edit ranges in ${path}`);
        }
        const startRow = edit.oldRange.start.row;
        const startCol = edit.oldRange.start.column;
        const lineLength = buffer.lineLengthForRow(startRow);
        if (lineLength == null || startCol > lineLength) {
            throw Error(`Out of range edit on ${path}:${startRow + 1}:${startCol + 1}`);
        }
    }
}
exports.default = ApplyEditAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHktZWRpdC1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQ0Esd0NBQWlDO0FBV2pDLDBEQUEwRDtBQUMxRCxNQUFxQixnQkFBZ0I7SUFDbkMseUVBQXlFO0lBQ2xFLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBb0M7UUFDdkQsVUFBVSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDakUsQ0FBQztJQUVEOzs7T0FHRztJQUNJLE1BQU0sQ0FBQyxVQUFVLENBQ3RCLE1BQWtCLEVBQ2xCLEtBQXlCO1FBRXpCLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBQzdDLElBQUk7WUFDRix5REFBeUQ7WUFDekQsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDdEUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQWlDLEVBQUUsT0FBTyxFQUFFLEVBQUU7Z0JBQzFELGdCQUFnQixDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO2dCQUN6RCxNQUFNLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN6RCxPQUFPLE9BQU8sQ0FBQztZQUNqQixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDVCxNQUFNLENBQUMsMkJBQTJCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDL0MsT0FBTyxVQUFVLENBQUM7U0FDbkI7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUN0QyxNQUFNLEdBQUcsQ0FBQztTQUNYO0lBQ0gsQ0FBQztJQUVNLE1BQU0sQ0FBTyxXQUFXLENBQUMsTUFBZ0M7O1lBRTlELElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztZQUV4QyxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO2dCQUMvQixPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLE1BQU0sQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUM3QyxJQUFJLE1BQU0sSUFBSSxNQUFNLENBQUMsWUFBWSxFQUFFO3dCQUNqQyxPQUFPLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDO3FCQUNqRDtnQkFDSCxDQUFDLENBQUMsQ0FBQzthQUNKO1lBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVsQyxvREFBb0Q7WUFDcEQsTUFBTSxXQUFXLEdBQXNELEVBQUUsQ0FBQztZQUUxRSxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQU8sR0FBRyxFQUFFLEVBQUU7Z0JBQ3RDLE1BQU0sSUFBSSxHQUFHLGlCQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNwQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUN0QyxJQUFJLEVBQUU7b0JBQ0osY0FBYyxFQUFFLElBQUk7b0JBQ3BCLHNDQUFzQztvQkFDdEMsWUFBWSxFQUFFLEtBQUs7b0JBQ25CLFlBQVksRUFBRSxLQUFLO2lCQUNwQixDQUNZLENBQUM7Z0JBQ2hCLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQztnQkFDbEMsOEVBQThFO2dCQUM5RSxNQUFNLEtBQUssR0FBRyxpQkFBTyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUN2RCxNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUM5RCxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDM0MsQ0FBQyxDQUFBLENBQUMsQ0FBQztZQUVILGdEQUFnRDtZQUNoRCxNQUFNLE9BQU8sR0FBRyxNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO2lCQUN4QyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDO2lCQUNoQixLQUFLLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtnQkFDYixJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyw2QkFBNkIsRUFBRTtvQkFDekQsV0FBVyxFQUFFLHdCQUF3QjtvQkFDckMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxPQUFPO2lCQUNwQixDQUFDLENBQUM7Z0JBQ0gsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUU7b0JBQzdDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFDeEMsQ0FBQyxDQUFDLENBQUM7Z0JBQ0gsT0FBTyxLQUFLLENBQUM7WUFDZixDQUFDLENBQUMsQ0FBQztZQUVMLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNyQixDQUFDO0tBQUE7SUFFRCw2REFBNkQ7SUFDckQsTUFBTSxDQUFDLFlBQVksQ0FDekIsTUFBa0IsRUFDbEIsSUFBc0IsRUFDdEIsUUFBaUM7UUFFakMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQztRQUNwQyxJQUFJLFFBQVEsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUU7WUFDdEUsTUFBTSxLQUFLLENBQUMsb0NBQW9DLElBQUksRUFBRSxDQUFDLENBQUM7U0FDekQ7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUM7UUFDekMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1FBQzVDLE1BQU0sVUFBVSxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNyRCxJQUFJLFVBQVUsSUFBSSxJQUFJLElBQUksUUFBUSxHQUFHLFVBQVUsRUFBRTtZQUMvQyxNQUFNLEtBQUssQ0FBQyx3QkFBd0IsSUFBSSxJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDN0U7SUFDSCxDQUFDO0NBQ0Y7QUFwR0QsbUNBb0dDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXRvbUlkZSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi9jb252ZXJ0JztcbmltcG9ydCB7XG4gIExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbixcbiAgQXBwbHlXb3Jrc3BhY2VFZGl0UGFyYW1zLFxuICBBcHBseVdvcmtzcGFjZUVkaXRSZXNwb25zZSxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHtcbiAgVGV4dEJ1ZmZlcixcbiAgVGV4dEVkaXRvcixcbn0gZnJvbSAnYXRvbSc7XG5cbi8vIFB1YmxpYzogQWRhcHRzIHdvcmtzcGFjZS9hcHBseUVkaXQgY29tbWFuZHMgdG8gZWRpdG9ycy5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEFwcGx5RWRpdEFkYXB0ZXIge1xuICAvLyBQdWJsaWM6IEF0dGFjaCB0byBhIHtMYW5ndWFnZUNsaWVudENvbm5lY3Rpb259IHRvIHJlY2VpdmUgZWRpdCBldmVudHMuXG4gIHB1YmxpYyBzdGF0aWMgYXR0YWNoKGNvbm5lY3Rpb246IExhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbikge1xuICAgIGNvbm5lY3Rpb24ub25BcHBseUVkaXQoKG0pID0+IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQobSkpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRyaWVzIHRvIGFwcGx5IGVkaXRzIGFuZCByZXZlcnRzIGlmIGFueXRoaW5nIGdvZXMgd3JvbmcuXG4gICAqIFJldHVybnMgdGhlIGNoZWNrcG9pbnQsIHNvIHRoZSBjYWxsZXIgY2FuIHJldmVydCBjaGFuZ2VzIGlmIG5lZWRlZC5cbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXBwbHlFZGl0cyhcbiAgICBidWZmZXI6IFRleHRCdWZmZXIsXG4gICAgZWRpdHM6IGF0b21JZGUuVGV4dEVkaXRbXSxcbiAgKTogbnVtYmVyIHtcbiAgICBjb25zdCBjaGVja3BvaW50ID0gYnVmZmVyLmNyZWF0ZUNoZWNrcG9pbnQoKTtcbiAgICB0cnkge1xuICAgICAgLy8gU29ydCBlZGl0cyBpbiByZXZlcnNlIG9yZGVyIHRvIHByZXZlbnQgZWRpdCBjb25mbGljdHMuXG4gICAgICBlZGl0cy5zb3J0KChlZGl0MSwgZWRpdDIpID0+IC1lZGl0MS5vbGRSYW5nZS5jb21wYXJlKGVkaXQyLm9sZFJhbmdlKSk7XG4gICAgICBlZGl0cy5yZWR1Y2UoKHByZXZpb3VzOiBhdG9tSWRlLlRleHRFZGl0IHwgbnVsbCwgY3VycmVudCkgPT4ge1xuICAgICAgICBBcHBseUVkaXRBZGFwdGVyLnZhbGlkYXRlRWRpdChidWZmZXIsIGN1cnJlbnQsIHByZXZpb3VzKTtcbiAgICAgICAgYnVmZmVyLnNldFRleHRJblJhbmdlKGN1cnJlbnQub2xkUmFuZ2UsIGN1cnJlbnQubmV3VGV4dCk7XG4gICAgICAgIHJldHVybiBjdXJyZW50O1xuICAgICAgfSwgbnVsbCk7XG4gICAgICBidWZmZXIuZ3JvdXBDaGFuZ2VzU2luY2VDaGVja3BvaW50KGNoZWNrcG9pbnQpO1xuICAgICAgcmV0dXJuIGNoZWNrcG9pbnQ7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBidWZmZXIucmV2ZXJ0VG9DaGVja3BvaW50KGNoZWNrcG9pbnQpO1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgb25BcHBseUVkaXQocGFyYW1zOiBBcHBseVdvcmtzcGFjZUVkaXRQYXJhbXMpOiBQcm9taXNlPEFwcGx5V29ya3NwYWNlRWRpdFJlc3BvbnNlPiB7XG5cbiAgICBsZXQgY2hhbmdlcyA9IHBhcmFtcy5lZGl0LmNoYW5nZXMgfHwge307XG5cbiAgICBpZiAocGFyYW1zLmVkaXQuZG9jdW1lbnRDaGFuZ2VzKSB7XG4gICAgICBjaGFuZ2VzID0ge307XG4gICAgICBwYXJhbXMuZWRpdC5kb2N1bWVudENoYW5nZXMuZm9yRWFjaCgoY2hhbmdlKSA9PiB7XG4gICAgICAgIGlmIChjaGFuZ2UgJiYgY2hhbmdlLnRleHREb2N1bWVudCkge1xuICAgICAgICAgIGNoYW5nZXNbY2hhbmdlLnRleHREb2N1bWVudC51cmldID0gY2hhbmdlLmVkaXRzO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB1cmlzID0gT2JqZWN0LmtleXMoY2hhbmdlcyk7XG5cbiAgICAvLyBLZWVwIGNoZWNrcG9pbnRzIGZyb20gYWxsIHN1Y2Nlc3NmdWwgYnVmZmVyIGVkaXRzXG4gICAgY29uc3QgY2hlY2twb2ludHM6IEFycmF5PHsgYnVmZmVyOiBUZXh0QnVmZmVyLCBjaGVja3BvaW50OiBudW1iZXIgfT4gPSBbXTtcblxuICAgIGNvbnN0IHByb21pc2VzID0gdXJpcy5tYXAoYXN5bmMgKHVyaSkgPT4ge1xuICAgICAgY29uc3QgcGF0aCA9IENvbnZlcnQudXJpVG9QYXRoKHVyaSk7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFxuICAgICAgICBwYXRoLCB7XG4gICAgICAgICAgc2VhcmNoQWxsUGFuZXM6IHRydWUsXG4gICAgICAgICAgLy8gT3BlbiBuZXcgZWRpdG9ycyBpbiB0aGUgYmFja2dyb3VuZC5cbiAgICAgICAgICBhY3RpdmF0ZVBhbmU6IGZhbHNlLFxuICAgICAgICAgIGFjdGl2YXRlSXRlbTogZmFsc2UsXG4gICAgICAgIH0sXG4gICAgICApIGFzIFRleHRFZGl0b3I7XG4gICAgICBjb25zdCBidWZmZXIgPSBlZGl0b3IuZ2V0QnVmZmVyKCk7XG4gICAgICAvLyBHZXQgYW4gZXhpc3RpbmcgZWRpdG9yIGZvciB0aGUgZmlsZSwgb3Igb3BlbiBhIG5ldyBvbmUgaWYgaXQgZG9lc24ndCBleGlzdC5cbiAgICAgIGNvbnN0IGVkaXRzID0gQ29udmVydC5jb252ZXJ0THNUZXh0RWRpdHMoY2hhbmdlc1t1cmldKTtcbiAgICAgIGNvbnN0IGNoZWNrcG9pbnQgPSBBcHBseUVkaXRBZGFwdGVyLmFwcGx5RWRpdHMoYnVmZmVyLCBlZGl0cyk7XG4gICAgICBjaGVja3BvaW50cy5wdXNoKHsgYnVmZmVyLCBjaGVja3BvaW50IH0pO1xuICAgIH0pO1xuXG4gICAgLy8gQXBwbHkgYWxsIGVkaXRzIG9yIGZhaWwgYW5kIHJldmVydCBldmVyeXRoaW5nXG4gICAgY29uc3QgYXBwbGllZCA9IGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKVxuICAgICAgLnRoZW4oKCkgPT4gdHJ1ZSlcbiAgICAgIC5jYXRjaCgoZXJyKSA9PiB7XG4gICAgICAgIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcignd29ya3NwYWNlL2FwcGx5RWRpdHMgZmFpbGVkJywge1xuICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmFpbGVkIHRvIGFwcGx5IGVkaXRzLicsXG4gICAgICAgICAgZGV0YWlsOiBlcnIubWVzc2FnZSxcbiAgICAgICAgfSk7XG4gICAgICAgIGNoZWNrcG9pbnRzLmZvckVhY2goKHsgYnVmZmVyLCBjaGVja3BvaW50IH0pID0+IHtcbiAgICAgICAgICBidWZmZXIucmV2ZXJ0VG9DaGVja3BvaW50KGNoZWNrcG9pbnQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4geyBhcHBsaWVkIH07XG4gIH1cblxuICAvLyBQcml2YXRlOiBEbyBzb21lIGJhc2ljIHNhbml0eSBjaGVja2luZyBvbiB0aGUgZWRpdCByYW5nZXMuXG4gIHByaXZhdGUgc3RhdGljIHZhbGlkYXRlRWRpdChcbiAgICBidWZmZXI6IFRleHRCdWZmZXIsXG4gICAgZWRpdDogYXRvbUlkZS5UZXh0RWRpdCxcbiAgICBwcmV2RWRpdDogYXRvbUlkZS5UZXh0RWRpdCB8IG51bGwsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHBhdGggPSBidWZmZXIuZ2V0UGF0aCgpIHx8ICcnO1xuICAgIGlmIChwcmV2RWRpdCAmJiBlZGl0Lm9sZFJhbmdlLmVuZC5jb21wYXJlKHByZXZFZGl0Lm9sZFJhbmdlLnN0YXJ0KSA+IDApIHtcbiAgICAgIHRocm93IEVycm9yKGBGb3VuZCBvdmVybGFwcGluZyBlZGl0IHJhbmdlcyBpbiAke3BhdGh9YCk7XG4gICAgfVxuICAgIGNvbnN0IHN0YXJ0Um93ID0gZWRpdC5vbGRSYW5nZS5zdGFydC5yb3c7XG4gICAgY29uc3Qgc3RhcnRDb2wgPSBlZGl0Lm9sZFJhbmdlLnN0YXJ0LmNvbHVtbjtcbiAgICBjb25zdCBsaW5lTGVuZ3RoID0gYnVmZmVyLmxpbmVMZW5ndGhGb3JSb3coc3RhcnRSb3cpO1xuICAgIGlmIChsaW5lTGVuZ3RoID09IG51bGwgfHwgc3RhcnRDb2wgPiBsaW5lTGVuZ3RoKSB7XG4gICAgICB0aHJvdyBFcnJvcihgT3V0IG9mIHJhbmdlIGVkaXQgb24gJHtwYXRofToke3N0YXJ0Um93ICsgMX06JHtzdGFydENvbCArIDF9YCk7XG4gICAgfVxuICB9XG59XG4iXX0=
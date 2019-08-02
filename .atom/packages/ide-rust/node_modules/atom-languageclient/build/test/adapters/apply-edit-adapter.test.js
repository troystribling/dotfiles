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
const chai_1 = require("chai");
const path = require("path");
const sinon = require("sinon");
const apply_edit_adapter_1 = require("../../lib/adapters/apply-edit-adapter");
const convert_1 = require("../../lib/convert");
const TEST_PATH1 = normalizeDriveLetterName(path.join(__dirname, 'test.txt'));
const TEST_PATH2 = normalizeDriveLetterName(path.join(__dirname, 'test2.txt'));
const TEST_PATH3 = normalizeDriveLetterName(path.join(__dirname, 'test3.txt'));
const TEST_PATH4 = normalizeDriveLetterName(path.join(__dirname, 'test4.txt'));
function normalizeDriveLetterName(filePath) {
    if (process.platform === 'win32') {
        return filePath.replace(/^([a-z]):/, ([driveLetter]) => driveLetter.toUpperCase() + ':');
    }
    else {
        return filePath;
    }
}
describe('ApplyEditAdapter', () => {
    describe('onApplyEdit', () => {
        beforeEach(() => {
            sinon.spy(atom.notifications, 'addError');
        });
        afterEach(() => {
            atom.notifications.addError.restore();
        });
        it('works for open files', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH1);
            editor.setText('abc\ndef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [convert_1.default.pathToUri(TEST_PATH1)]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 3 },
                                },
                                newText: 'def',
                            },
                            {
                                range: {
                                    start: { line: 1, character: 0 },
                                    end: { line: 1, character: 3 },
                                },
                                newText: 'ghi',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            chai_1.expect(editor.getText()).to.equal('def\nghi\n');
            // Undo should be atomic.
            editor.getBuffer().undo();
            chai_1.expect(editor.getText()).to.equal('abc\ndef\n');
        }));
        it('works with TextDocumentEdits', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH1);
            editor.setText('abc\ndef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    documentChanges: [{
                            textDocument: {
                                version: 1,
                                uri: convert_1.default.pathToUri(TEST_PATH1),
                            },
                            edits: [
                                {
                                    range: {
                                        start: { line: 0, character: 0 },
                                        end: { line: 0, character: 3 },
                                    },
                                    newText: 'def',
                                },
                                {
                                    range: {
                                        start: { line: 1, character: 0 },
                                        end: { line: 1, character: 3 },
                                    },
                                    newText: 'ghi',
                                },
                            ],
                        }],
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            chai_1.expect(editor.getText()).to.equal('def\nghi\n');
            // Undo should be atomic.
            editor.getBuffer().undo();
            chai_1.expect(editor.getText()).to.equal('abc\ndef\n');
        }));
        it('opens files that are not already open', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH2]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 0 },
                                },
                                newText: 'abc',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(true);
            const editor = yield atom.workspace.open(TEST_PATH2);
            chai_1.expect(editor.getText()).to.equal('abc');
        }));
        it('fails with overlapping edits', () => __awaiter(this, void 0, void 0, function* () {
            const editor = yield atom.workspace.open(TEST_PATH3);
            editor.setText('abcdef\n');
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH3]: [
                            {
                                range: {
                                    start: { line: 0, character: 0 },
                                    end: { line: 0, character: 3 },
                                },
                                newText: 'def',
                            },
                            {
                                range: {
                                    start: { line: 0, character: 2 },
                                    end: { line: 0, character: 4 },
                                },
                                newText: 'ghi',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(false);
            chai_1.expect(atom.notifications.addError.calledWith('workspace/applyEdits failed', {
                description: 'Failed to apply edits.',
                detail: `Found overlapping edit ranges in ${TEST_PATH3}`,
            })).to.equal(true);
            // No changes.
            chai_1.expect(editor.getText()).to.equal('abcdef\n');
        }));
        it('fails with out-of-range edits', () => __awaiter(this, void 0, void 0, function* () {
            const result = yield apply_edit_adapter_1.default.onApplyEdit({
                edit: {
                    changes: {
                        [TEST_PATH4]: [
                            {
                                range: {
                                    start: { line: 0, character: 1 },
                                    end: { line: 0, character: 2 },
                                },
                                newText: 'def',
                            },
                        ],
                    },
                },
            });
            chai_1.expect(result.applied).to.equal(false);
            const errorCalls = atom.notifications.addError.getCalls();
            chai_1.expect(errorCalls.length).to.equal(1);
            chai_1.expect(errorCalls[0].args[1].detail).to.equal(`Out of range edit on ${TEST_PATH4}:1:2`);
        }));
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbHktZWRpdC1hZGFwdGVyLnRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi90ZXN0L2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlci50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSwrQkFBOEI7QUFDOUIsNkJBQTZCO0FBQzdCLCtCQUErQjtBQUMvQiw4RUFBcUU7QUFDckUsK0NBQXdDO0FBR3hDLE1BQU0sVUFBVSxHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7QUFDOUUsTUFBTSxVQUFVLEdBQUcsd0JBQXdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztBQUMvRSxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQy9FLE1BQU0sVUFBVSxHQUFHLHdCQUF3QixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7QUFFL0UsU0FBUyx3QkFBd0IsQ0FBQyxRQUFnQjtJQUNoRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxFQUFFO1FBQ2hDLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7S0FDMUY7U0FBTTtRQUNMLE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0FBQ0gsQ0FBQztBQUVELFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUU7SUFDaEMsUUFBUSxDQUFDLGFBQWEsRUFBRSxHQUFHLEVBQUU7UUFDM0IsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQUMsQ0FBQztRQUVILFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDWixJQUFZLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqRCxDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzQkFBc0IsRUFBRSxHQUFTLEVBQUU7WUFDcEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQWUsQ0FBQztZQUNuRSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTdCLE1BQU0sTUFBTSxHQUFHLE1BQU0sNEJBQWdCLENBQUMsV0FBVyxDQUFDO2dCQUNoRCxJQUFJLEVBQUU7b0JBQ0osT0FBTyxFQUFFO3dCQUNQLENBQUMsaUJBQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRTs0QkFDL0I7Z0NBQ0UsS0FBSyxFQUFFO29DQUNMLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtvQ0FDaEMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO2lDQUMvQjtnQ0FDRCxPQUFPLEVBQUUsS0FBSzs2QkFDZjs0QkFDRDtnQ0FDRSxLQUFLLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO29DQUNoQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7aUNBQy9CO2dDQUNELE9BQU8sRUFBRSxLQUFLOzZCQUNmO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RDLGFBQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRWhELHlCQUF5QjtZQUN6QixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDMUIsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbEQsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyw4QkFBOEIsRUFBRSxHQUFTLEVBQUU7WUFDNUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQWUsQ0FBQztZQUNuRSxNQUFNLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBRTdCLE1BQU0sTUFBTSxHQUFHLE1BQU0sNEJBQWdCLENBQUMsV0FBVyxDQUFDO2dCQUNoRCxJQUFJLEVBQUU7b0JBQ0osZUFBZSxFQUFFLENBQUM7NEJBQ2hCLFlBQVksRUFBRTtnQ0FDWixPQUFPLEVBQUUsQ0FBQztnQ0FDVixHQUFHLEVBQUUsaUJBQU8sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDOzZCQUNuQzs0QkFDRCxLQUFLLEVBQUU7Z0NBQ0w7b0NBQ0UsS0FBSyxFQUFFO3dDQUNMLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTt3Q0FDaEMsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO3FDQUMvQjtvQ0FDRCxPQUFPLEVBQUUsS0FBSztpQ0FDZjtnQ0FDRDtvQ0FDRSxLQUFLLEVBQUU7d0NBQ0wsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO3dDQUNoQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7cUNBQy9CO29DQUNELE9BQU8sRUFBRSxLQUFLO2lDQUNmOzZCQUNGO3lCQUNGLENBQUM7aUJBQ0g7YUFDRixDQUFDLENBQUM7WUFFSCxhQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFaEQseUJBQXlCO1lBQ3pCLE1BQU0sQ0FBQyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUMxQixhQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLHVDQUF1QyxFQUFFLEdBQVMsRUFBRTtZQUNyRCxNQUFNLE1BQU0sR0FBRyxNQUFNLDRCQUFnQixDQUFDLFdBQVcsQ0FBQztnQkFDaEQsSUFBSSxFQUFFO29CQUNKLE9BQU8sRUFBRTt3QkFDUCxDQUFDLFVBQVUsQ0FBQyxFQUFFOzRCQUNaO2dDQUNFLEtBQUssRUFBRTtvQ0FDTCxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0NBQ2hDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtpQ0FDL0I7Z0NBQ0QsT0FBTyxFQUFFLEtBQUs7NkJBQ2Y7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDLENBQUM7WUFFSCxhQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQWUsQ0FBQztZQUNuRSxhQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhCQUE4QixFQUFFLEdBQVMsRUFBRTtZQUM1QyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBZSxDQUFDO1lBQ25FLE1BQU0sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFM0IsTUFBTSxNQUFNLEdBQUcsTUFBTSw0QkFBZ0IsQ0FBQyxXQUFXLENBQUM7Z0JBQ2hELElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUU7d0JBQ1AsQ0FBQyxVQUFVLENBQUMsRUFBRTs0QkFDWjtnQ0FDRSxLQUFLLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO29DQUNoQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7aUNBQy9CO2dDQUNELE9BQU8sRUFBRSxLQUFLOzZCQUNmOzRCQUNEO2dDQUNFLEtBQUssRUFBRTtvQ0FDTCxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7b0NBQ2hDLEdBQUcsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsRUFBRTtpQ0FDL0I7Z0NBQ0QsT0FBTyxFQUFFLEtBQUs7NkJBQ2Y7eUJBQ0Y7cUJBQ0Y7aUJBQ0Y7YUFDRixDQUFDLENBQUM7WUFFSCxhQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsYUFBTSxDQUNILElBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyw2QkFBNkIsRUFBRTtnQkFDN0UsV0FBVyxFQUFFLHdCQUF3QjtnQkFDckMsTUFBTSxFQUFFLG9DQUFvQyxVQUFVLEVBQUU7YUFDekQsQ0FBQyxDQUNILENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqQixjQUFjO1lBQ2QsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFBLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQywrQkFBK0IsRUFBRSxHQUFTLEVBQUU7WUFDN0MsTUFBTSxNQUFNLEdBQUcsTUFBTSw0QkFBZ0IsQ0FBQyxXQUFXLENBQUM7Z0JBQ2hELElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUU7d0JBQ1AsQ0FBQyxVQUFVLENBQUMsRUFBRTs0QkFDWjtnQ0FDRSxLQUFLLEVBQUU7b0NBQ0wsS0FBSyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFO29DQUNoQyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQUU7aUNBQy9CO2dDQUNELE9BQU8sRUFBRSxLQUFLOzZCQUNmO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUFDO1lBRUgsYUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sVUFBVSxHQUFJLElBQVksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ25FLGFBQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxhQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHdCQUF3QixVQUFVLE1BQU0sQ0FBQyxDQUFDO1FBQzFGLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhwZWN0IH0gZnJvbSAnY2hhaSc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgc2lub24gZnJvbSAnc2lub24nO1xuaW1wb3J0IEFwcGx5RWRpdEFkYXB0ZXIgZnJvbSAnLi4vLi4vbGliL2FkYXB0ZXJzL2FwcGx5LWVkaXQtYWRhcHRlcic7XG5pbXBvcnQgQ29udmVydCBmcm9tICcuLi8uLi9saWIvY29udmVydCc7XG5pbXBvcnQgeyBUZXh0RWRpdG9yIH0gZnJvbSAnYXRvbSc7XG5cbmNvbnN0IFRFU1RfUEFUSDEgPSBub3JtYWxpemVEcml2ZUxldHRlck5hbWUocGF0aC5qb2luKF9fZGlybmFtZSwgJ3Rlc3QudHh0JykpO1xuY29uc3QgVEVTVF9QQVRIMiA9IG5vcm1hbGl6ZURyaXZlTGV0dGVyTmFtZShwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdDIudHh0JykpO1xuY29uc3QgVEVTVF9QQVRIMyA9IG5vcm1hbGl6ZURyaXZlTGV0dGVyTmFtZShwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdDMudHh0JykpO1xuY29uc3QgVEVTVF9QQVRINCA9IG5vcm1hbGl6ZURyaXZlTGV0dGVyTmFtZShwYXRoLmpvaW4oX19kaXJuYW1lLCAndGVzdDQudHh0JykpO1xuXG5mdW5jdGlvbiBub3JtYWxpemVEcml2ZUxldHRlck5hbWUoZmlsZVBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInKSB7XG4gICAgcmV0dXJuIGZpbGVQYXRoLnJlcGxhY2UoL14oW2Etel0pOi8sIChbZHJpdmVMZXR0ZXJdKSA9PiBkcml2ZUxldHRlci50b1VwcGVyQ2FzZSgpICsgJzonKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmlsZVBhdGg7XG4gIH1cbn1cblxuZGVzY3JpYmUoJ0FwcGx5RWRpdEFkYXB0ZXInLCAoKSA9PiB7XG4gIGRlc2NyaWJlKCdvbkFwcGx5RWRpdCcsICgpID0+IHtcbiAgICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICAgIHNpbm9uLnNweShhdG9tLm5vdGlmaWNhdGlvbnMsICdhZGRFcnJvcicpO1xuICAgIH0pO1xuXG4gICAgYWZ0ZXJFYWNoKCgpID0+IHtcbiAgICAgIChhdG9tIGFzIGFueSkubm90aWZpY2F0aW9ucy5hZGRFcnJvci5yZXN0b3JlKCk7XG4gICAgfSk7XG5cbiAgICBpdCgnd29ya3MgZm9yIG9wZW4gZmlsZXMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBhd2FpdCBhdG9tLndvcmtzcGFjZS5vcGVuKFRFU1RfUEFUSDEpIGFzIFRleHRFZGl0b3I7XG4gICAgICBlZGl0b3Iuc2V0VGV4dCgnYWJjXFxuZGVmXFxuJyk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IEFwcGx5RWRpdEFkYXB0ZXIub25BcHBseUVkaXQoe1xuICAgICAgICBlZGl0OiB7XG4gICAgICAgICAgY2hhbmdlczoge1xuICAgICAgICAgICAgW0NvbnZlcnQucGF0aFRvVXJpKFRFU1RfUEFUSDEpXTogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMCB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMyB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2RlZicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHsgbGluZTogMSwgY2hhcmFjdGVyOiAwIH0sXG4gICAgICAgICAgICAgICAgICBlbmQ6IHsgbGluZTogMSwgY2hhcmFjdGVyOiAzIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdUZXh0OiAnZ2hpJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuXG4gICAgICBleHBlY3QocmVzdWx0LmFwcGxpZWQpLnRvLmVxdWFsKHRydWUpO1xuICAgICAgZXhwZWN0KGVkaXRvci5nZXRUZXh0KCkpLnRvLmVxdWFsKCdkZWZcXG5naGlcXG4nKTtcblxuICAgICAgLy8gVW5kbyBzaG91bGQgYmUgYXRvbWljLlxuICAgICAgZWRpdG9yLmdldEJ1ZmZlcigpLnVuZG8oKTtcbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnYWJjXFxuZGVmXFxuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnd29ya3Mgd2l0aCBUZXh0RG9jdW1lbnRFZGl0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oVEVTVF9QQVRIMSkgYXMgVGV4dEVkaXRvcjtcbiAgICAgIGVkaXRvci5zZXRUZXh0KCdhYmNcXG5kZWZcXG4nKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgQXBwbHlFZGl0QWRhcHRlci5vbkFwcGx5RWRpdCh7XG4gICAgICAgIGVkaXQ6IHtcbiAgICAgICAgICBkb2N1bWVudENoYW5nZXM6IFt7XG4gICAgICAgICAgICB0ZXh0RG9jdW1lbnQ6IHtcbiAgICAgICAgICAgICAgdmVyc2lvbjogMSxcbiAgICAgICAgICAgICAgdXJpOiBDb252ZXJ0LnBhdGhUb1VyaShURVNUX1BBVEgxKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlZGl0czogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMCB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMyB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2RlZicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByYW5nZToge1xuICAgICAgICAgICAgICAgICAgc3RhcnQ6IHsgbGluZTogMSwgY2hhcmFjdGVyOiAwIH0sXG4gICAgICAgICAgICAgICAgICBlbmQ6IHsgbGluZTogMSwgY2hhcmFjdGVyOiAzIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBuZXdUZXh0OiAnZ2hpJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfV0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hcHBsaWVkKS50by5lcXVhbCh0cnVlKTtcbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnZGVmXFxuZ2hpXFxuJyk7XG5cbiAgICAgIC8vIFVuZG8gc2hvdWxkIGJlIGF0b21pYy5cbiAgICAgIGVkaXRvci5nZXRCdWZmZXIoKS51bmRvKCk7XG4gICAgICBleHBlY3QoZWRpdG9yLmdldFRleHQoKSkudG8uZXF1YWwoJ2FiY1xcbmRlZlxcbicpO1xuICAgIH0pO1xuXG4gICAgaXQoJ29wZW5zIGZpbGVzIHRoYXQgYXJlIG5vdCBhbHJlYWR5IG9wZW4nLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBBcHBseUVkaXRBZGFwdGVyLm9uQXBwbHlFZGl0KHtcbiAgICAgICAgZWRpdDoge1xuICAgICAgICAgIGNoYW5nZXM6IHtcbiAgICAgICAgICAgIFtURVNUX1BBVEgyXTogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMCB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMCB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2FiYycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hcHBsaWVkKS50by5lcXVhbCh0cnVlKTtcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oVEVTVF9QQVRIMikgYXMgVGV4dEVkaXRvcjtcbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnYWJjJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZmFpbHMgd2l0aCBvdmVybGFwcGluZyBlZGl0cycsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IGF3YWl0IGF0b20ud29ya3NwYWNlLm9wZW4oVEVTVF9QQVRIMykgYXMgVGV4dEVkaXRvcjtcbiAgICAgIGVkaXRvci5zZXRUZXh0KCdhYmNkZWZcXG4nKTtcblxuICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgQXBwbHlFZGl0QWRhcHRlci5vbkFwcGx5RWRpdCh7XG4gICAgICAgIGVkaXQ6IHtcbiAgICAgICAgICBjaGFuZ2VzOiB7XG4gICAgICAgICAgICBbVEVTVF9QQVRIM106IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHJhbmdlOiB7XG4gICAgICAgICAgICAgICAgICBzdGFydDogeyBsaW5lOiAwLCBjaGFyYWN0ZXI6IDAgfSxcbiAgICAgICAgICAgICAgICAgIGVuZDogeyBsaW5lOiAwLCBjaGFyYWN0ZXI6IDMgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG5ld1RleHQ6ICdkZWYnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMiB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogNCB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2doaScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hcHBsaWVkKS50by5lcXVhbChmYWxzZSk7XG4gICAgICBleHBlY3QoXG4gICAgICAgIChhdG9tIGFzIGFueSkubm90aWZpY2F0aW9ucy5hZGRFcnJvci5jYWxsZWRXaXRoKCd3b3Jrc3BhY2UvYXBwbHlFZGl0cyBmYWlsZWQnLCB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdGYWlsZWQgdG8gYXBwbHkgZWRpdHMuJyxcbiAgICAgICAgICBkZXRhaWw6IGBGb3VuZCBvdmVybGFwcGluZyBlZGl0IHJhbmdlcyBpbiAke1RFU1RfUEFUSDN9YCxcbiAgICAgICAgfSksXG4gICAgICApLnRvLmVxdWFsKHRydWUpO1xuICAgICAgLy8gTm8gY2hhbmdlcy5cbiAgICAgIGV4cGVjdChlZGl0b3IuZ2V0VGV4dCgpKS50by5lcXVhbCgnYWJjZGVmXFxuJyk7XG4gICAgfSk7XG5cbiAgICBpdCgnZmFpbHMgd2l0aCBvdXQtb2YtcmFuZ2UgZWRpdHMnLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBBcHBseUVkaXRBZGFwdGVyLm9uQXBwbHlFZGl0KHtcbiAgICAgICAgZWRpdDoge1xuICAgICAgICAgIGNoYW5nZXM6IHtcbiAgICAgICAgICAgIFtURVNUX1BBVEg0XTogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcmFuZ2U6IHtcbiAgICAgICAgICAgICAgICAgIHN0YXJ0OiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMSB9LFxuICAgICAgICAgICAgICAgICAgZW5kOiB7IGxpbmU6IDAsIGNoYXJhY3RlcjogMiB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbmV3VGV4dDogJ2RlZicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KTtcblxuICAgICAgZXhwZWN0KHJlc3VsdC5hcHBsaWVkKS50by5lcXVhbChmYWxzZSk7XG4gICAgICBjb25zdCBlcnJvckNhbGxzID0gKGF0b20gYXMgYW55KS5ub3RpZmljYXRpb25zLmFkZEVycm9yLmdldENhbGxzKCk7XG4gICAgICBleHBlY3QoZXJyb3JDYWxscy5sZW5ndGgpLnRvLmVxdWFsKDEpO1xuICAgICAgZXhwZWN0KGVycm9yQ2FsbHNbMF0uYXJnc1sxXS5kZXRhaWwpLnRvLmVxdWFsKGBPdXQgb2YgcmFuZ2UgZWRpdCBvbiAke1RFU1RfUEFUSDR9OjE6MmApO1xuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
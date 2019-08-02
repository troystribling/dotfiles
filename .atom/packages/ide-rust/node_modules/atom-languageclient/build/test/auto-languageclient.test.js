"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_languageclient_1 = require("../lib/auto-languageclient");
const chai_1 = require("chai");
describe('AutoLanguageClient', () => {
    describe('shouldSyncForEditor', () => {
        class CustomAutoLanguageClient extends auto_languageclient_1.default {
            getGrammarScopes() {
                return ['Java', 'Python'];
            }
        }
        const client = new CustomAutoLanguageClient();
        function mockEditor(uri, scopeName) {
            return {
                getPath: () => uri,
                getGrammar: () => {
                    return { scopeName };
                },
            };
        }
        it('selects documents in project and in supported language', () => {
            const editor = mockEditor('/path/to/somewhere', client.getGrammarScopes()[0]);
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(true);
        });
        it('does not select documents outside of project', () => {
            const editor = mockEditor('/path/to/elsewhere/file', client.getGrammarScopes()[0]);
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
        it('does not select documents in unsupported language', () => {
            const editor = mockEditor('/path/to/somewhere', client.getGrammarScopes()[0] + '-dummy');
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
        it('does not select documents in unsupported language outside of project', () => {
            const editor = mockEditor('/path/to/elsewhere/file', client.getGrammarScopes()[0] + '-dummy');
            chai_1.expect(client.shouldSyncForEditor(editor, '/path/to/somewhere')).equals(false);
        });
    });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0by1sYW5ndWFnZWNsaWVudC50ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vdGVzdC9hdXRvLWxhbmd1YWdlY2xpZW50LnRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxvRUFBNEQ7QUFDNUQsK0JBQThCO0FBRTlCLFFBQVEsQ0FBQyxvQkFBb0IsRUFBRSxHQUFHLEVBQUU7SUFDbEMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLEdBQUcsRUFBRTtRQUNuQyxNQUFNLHdCQUF5QixTQUFRLDZCQUFrQjtZQUNoRCxnQkFBZ0I7Z0JBQ3JCLE9BQU8sQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDNUIsQ0FBQztTQUNGO1FBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSx3QkFBd0IsRUFBRSxDQUFDO1FBRTlDLFNBQVMsVUFBVSxDQUFDLEdBQVcsRUFBRSxTQUFpQjtZQUNoRCxPQUFPO2dCQUNMLE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQyxHQUFHO2dCQUNsQixVQUFVLEVBQUUsR0FBRyxFQUFFO29CQUNmLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQztnQkFDdkIsQ0FBQzthQUNGLENBQUM7UUFDSixDQUFDO1FBRUQsRUFBRSxDQUFDLHdEQUF3RCxFQUFFLEdBQUcsRUFBRTtZQUNoRSxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5RSxhQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2hGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLDhDQUE4QyxFQUFFLEdBQUcsRUFBRTtZQUN0RCxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMseUJBQXlCLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuRixhQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLE1BQU0sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pGLENBQUMsQ0FBQyxDQUFDO1FBRUgsRUFBRSxDQUFDLG1EQUFtRCxFQUFFLEdBQUcsRUFBRTtZQUMzRCxNQUFNLE1BQU0sR0FBRyxVQUFVLENBQUMsb0JBQW9CLEVBQUUsTUFBTSxDQUFDLGdCQUFnQixFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUM7WUFDekYsYUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRixDQUFDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxzRUFBc0UsRUFBRSxHQUFHLEVBQUU7WUFDOUUsTUFBTSxNQUFNLEdBQUcsVUFBVSxDQUFDLHlCQUF5QixFQUFFLE1BQU0sQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDO1lBQzlGLGFBQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsTUFBTSxFQUFFLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEF1dG9MYW5ndWFnZUNsaWVudCBmcm9tICcuLi9saWIvYXV0by1sYW5ndWFnZWNsaWVudCc7XG5pbXBvcnQgeyBleHBlY3QgfSBmcm9tICdjaGFpJztcblxuZGVzY3JpYmUoJ0F1dG9MYW5ndWFnZUNsaWVudCcsICgpID0+IHtcbiAgZGVzY3JpYmUoJ3Nob3VsZFN5bmNGb3JFZGl0b3InLCAoKSA9PiB7XG4gICAgY2xhc3MgQ3VzdG9tQXV0b0xhbmd1YWdlQ2xpZW50IGV4dGVuZHMgQXV0b0xhbmd1YWdlQ2xpZW50IHtcbiAgICAgIHB1YmxpYyBnZXRHcmFtbWFyU2NvcGVzKCkge1xuICAgICAgICByZXR1cm4gWydKYXZhJywgJ1B5dGhvbiddO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNsaWVudCA9IG5ldyBDdXN0b21BdXRvTGFuZ3VhZ2VDbGllbnQoKTtcblxuICAgIGZ1bmN0aW9uIG1vY2tFZGl0b3IodXJpOiBzdHJpbmcsIHNjb3BlTmFtZTogc3RyaW5nKTogYW55IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdldFBhdGg6ICgpID0+IHVyaSxcbiAgICAgICAgZ2V0R3JhbW1hcjogKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB7IHNjb3BlTmFtZSB9O1xuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG5cbiAgICBpdCgnc2VsZWN0cyBkb2N1bWVudHMgaW4gcHJvamVjdCBhbmQgaW4gc3VwcG9ydGVkIGxhbmd1YWdlJywgKCkgPT4ge1xuICAgICAgY29uc3QgZWRpdG9yID0gbW9ja0VkaXRvcignL3BhdGgvdG8vc29tZXdoZXJlJywgY2xpZW50LmdldEdyYW1tYXJTY29wZXMoKVswXSk7XG4gICAgICBleHBlY3QoY2xpZW50LnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCAnL3BhdGgvdG8vc29tZXdoZXJlJykpLmVxdWFscyh0cnVlKTtcbiAgICB9KTtcblxuICAgIGl0KCdkb2VzIG5vdCBzZWxlY3QgZG9jdW1lbnRzIG91dHNpZGUgb2YgcHJvamVjdCcsICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IG1vY2tFZGl0b3IoJy9wYXRoL3RvL2Vsc2V3aGVyZS9maWxlJywgY2xpZW50LmdldEdyYW1tYXJTY29wZXMoKVswXSk7XG4gICAgICBleHBlY3QoY2xpZW50LnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCAnL3BhdGgvdG8vc29tZXdoZXJlJykpLmVxdWFscyhmYWxzZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnZG9lcyBub3Qgc2VsZWN0IGRvY3VtZW50cyBpbiB1bnN1cHBvcnRlZCBsYW5ndWFnZScsICgpID0+IHtcbiAgICAgIGNvbnN0IGVkaXRvciA9IG1vY2tFZGl0b3IoJy9wYXRoL3RvL3NvbWV3aGVyZScsIGNsaWVudC5nZXRHcmFtbWFyU2NvcGVzKClbMF0gKyAnLWR1bW15Jyk7XG4gICAgICBleHBlY3QoY2xpZW50LnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCAnL3BhdGgvdG8vc29tZXdoZXJlJykpLmVxdWFscyhmYWxzZSk7XG4gICAgfSk7XG5cbiAgICBpdCgnZG9lcyBub3Qgc2VsZWN0IGRvY3VtZW50cyBpbiB1bnN1cHBvcnRlZCBsYW5ndWFnZSBvdXRzaWRlIG9mIHByb2plY3QnLCAoKSA9PiB7XG4gICAgICBjb25zdCBlZGl0b3IgPSBtb2NrRWRpdG9yKCcvcGF0aC90by9lbHNld2hlcmUvZmlsZScsIGNsaWVudC5nZXRHcmFtbWFyU2NvcGVzKClbMF0gKyAnLWR1bW15Jyk7XG4gICAgICBleHBlY3QoY2xpZW50LnNob3VsZFN5bmNGb3JFZGl0b3IoZWRpdG9yLCAnL3BhdGgvdG8vc29tZXdoZXJlJykpLmVxdWFscyhmYWxzZSk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXX0=
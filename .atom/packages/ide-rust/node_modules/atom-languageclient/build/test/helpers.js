"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sinon = require("sinon");
const atom_1 = require("atom");
function createSpyConnection() {
    return {
        listen: sinon.spy(),
        onClose: sinon.spy(),
        onError: sinon.spy(),
        onDispose: sinon.spy(),
        onUnhandledNotification: sinon.spy(),
        onRequest: sinon.spy(),
        onNotification: sinon.spy(),
        dispose: sinon.spy(),
        sendRequest: sinon.spy(),
        sendNotification: sinon.spy(),
        trace: sinon.spy(),
        inspect: sinon.spy(),
    };
}
exports.createSpyConnection = createSpyConnection;
function createFakeEditor(path) {
    const editor = new atom_1.TextEditor();
    sinon.stub(editor, 'getSelectedBufferRange');
    sinon.spy(editor, 'setTextInBufferRange');
    editor.setTabLength(4);
    editor.setSoftTabs(true);
    editor.getBuffer().setPath(path || '/a/b/c/d.js');
    return editor;
}
exports.createFakeEditor = createFakeEditor;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaGVscGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3Rlc3QvaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtCQUErQjtBQUUvQiwrQkFBa0M7QUFFbEMsU0FBZ0IsbUJBQW1CO0lBQ2pDLE9BQU87UUFDTCxNQUFNLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNuQixPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNwQixPQUFPLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLEdBQUcsRUFBRTtRQUN0Qix1QkFBdUIsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ3BDLFNBQVMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ3RCLGNBQWMsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQzNCLE9BQU8sRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ3BCLFdBQVcsRUFBRSxLQUFLLENBQUMsR0FBRyxFQUFFO1FBQ3hCLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDN0IsS0FBSyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7UUFDbEIsT0FBTyxFQUFFLEtBQUssQ0FBQyxHQUFHLEVBQUU7S0FDckIsQ0FBQztBQUNKLENBQUM7QUFmRCxrREFlQztBQUVELFNBQWdCLGdCQUFnQixDQUFDLElBQWE7SUFDNUMsTUFBTSxNQUFNLEdBQUcsSUFBSSxpQkFBVSxFQUFFLENBQUM7SUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztJQUM3QyxLQUFLLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QixNQUFNLENBQUMsU0FBUyxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxhQUFhLENBQUMsQ0FBQztJQUNsRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBUkQsNENBUUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzaW5vbiBmcm9tICdzaW5vbic7XG5pbXBvcnQgKiBhcyBycGMgZnJvbSAndnNjb2RlLWpzb25ycGMnO1xuaW1wb3J0IHsgVGV4dEVkaXRvciB9IGZyb20gJ2F0b20nO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3B5Q29ubmVjdGlvbigpOiBycGMuTWVzc2FnZUNvbm5lY3Rpb24ge1xuICByZXR1cm4ge1xuICAgIGxpc3Rlbjogc2lub24uc3B5KCksXG4gICAgb25DbG9zZTogc2lub24uc3B5KCksXG4gICAgb25FcnJvcjogc2lub24uc3B5KCksXG4gICAgb25EaXNwb3NlOiBzaW5vbi5zcHkoKSxcbiAgICBvblVuaGFuZGxlZE5vdGlmaWNhdGlvbjogc2lub24uc3B5KCksXG4gICAgb25SZXF1ZXN0OiBzaW5vbi5zcHkoKSxcbiAgICBvbk5vdGlmaWNhdGlvbjogc2lub24uc3B5KCksXG4gICAgZGlzcG9zZTogc2lub24uc3B5KCksXG4gICAgc2VuZFJlcXVlc3Q6IHNpbm9uLnNweSgpLFxuICAgIHNlbmROb3RpZmljYXRpb246IHNpbm9uLnNweSgpLFxuICAgIHRyYWNlOiBzaW5vbi5zcHkoKSxcbiAgICBpbnNwZWN0OiBzaW5vbi5zcHkoKSxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUZha2VFZGl0b3IocGF0aD86IHN0cmluZyk6IFRleHRFZGl0b3Ige1xuICBjb25zdCBlZGl0b3IgPSBuZXcgVGV4dEVkaXRvcigpO1xuICBzaW5vbi5zdHViKGVkaXRvciwgJ2dldFNlbGVjdGVkQnVmZmVyUmFuZ2UnKTtcbiAgc2lub24uc3B5KGVkaXRvciwgJ3NldFRleHRJbkJ1ZmZlclJhbmdlJyk7XG4gIGVkaXRvci5zZXRUYWJMZW5ndGgoNCk7XG4gIGVkaXRvci5zZXRTb2Z0VGFicyh0cnVlKTtcbiAgZWRpdG9yLmdldEJ1ZmZlcigpLnNldFBhdGgocGF0aCB8fCAnL2EvYi9jL2QuanMnKTtcbiAgcmV0dXJuIGVkaXRvcjtcbn1cbiJdfQ==
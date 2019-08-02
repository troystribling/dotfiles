"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = require("../languageclient");
// Public: Adapts Atom's user notifications to those of the language server protocol.
class NotificationsAdapter {
    // Public: Attach to a {LanguageClientConnection} to recieve events indicating
    // when user notifications should be displayed.
    static attach(connection, name, projectPath) {
        connection.onShowMessage((m) => NotificationsAdapter.onShowMessage(m, name, projectPath));
        connection.onShowMessageRequest((m) => NotificationsAdapter.onShowMessageRequest(m, name, projectPath));
    }
    // Public: Show a notification message with buttons using the Atom notifications API.
    //
    // * `params` The {ShowMessageRequestParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessageRequest(params, name, projectPath) {
        return new Promise((resolve, _reject) => {
            const options = {
                dismissable: true,
                detail: `${name} ${projectPath}`,
            };
            if (params.actions) {
                options.buttons = params.actions.map((a) => ({
                    text: a.title,
                    onDidClick: () => {
                        resolve(a);
                        if (notification != null) {
                            notification.dismiss();
                        }
                    },
                }));
            }
            const notification = addNotificationForMessage(params.type, params.message, options);
            if (notification != null) {
                notification.onDidDismiss(() => {
                    resolve(null);
                });
            }
        });
    }
    // Public: Show a notification message using the Atom notifications API.
    //
    // * `params` The {ShowMessageParams} received from the language server
    //            indicating the details of the notification to be displayed.
    // * `name`   The name of the language server so the user can identify the
    //            context of the message.
    // * `projectPath`   The path of the current project.
    static onShowMessage(params, name, projectPath) {
        addNotificationForMessage(params.type, params.message, {
            dismissable: true,
            detail: `${name} ${projectPath}`,
        });
    }
    // Public: Convert a {MessageActionItem} from the language server into an
    // equivalent {NotificationButton} within Atom.
    //
    // * `actionItem` The {MessageActionItem} to be converted.
    //
    // Returns a {NotificationButton} equivalent to the {MessageActionItem} given.
    static actionItemToNotificationButton(actionItem) {
        return {
            text: actionItem.title,
        };
    }
}
exports.default = NotificationsAdapter;
function messageTypeToString(messageType) {
    switch (messageType) {
        case languageclient_1.MessageType.Error: return 'error';
        case languageclient_1.MessageType.Warning: return 'warning';
        default: return 'info';
    }
}
function addNotificationForMessage(messageType, message, options) {
    function isDuplicate(note) {
        const noteDismissed = note.isDismissed && note.isDismissed();
        const noteOptions = note.getOptions && note.getOptions() || {};
        return !noteDismissed &&
            note.getType() === messageTypeToString(messageType) &&
            note.getMessage() === message &&
            noteOptions.detail === options.detail;
    }
    if (atom.notifications.getNotifications().some(isDuplicate)) {
        return null;
    }
    switch (messageType) {
        case languageclient_1.MessageType.Error:
            return atom.notifications.addError(message, options);
        case languageclient_1.MessageType.Warning:
            return atom.notifications.addWarning(message, options);
        case languageclient_1.MessageType.Log:
            // console.log(params.message);
            return null;
        case languageclient_1.MessageType.Info:
        default:
            return atom.notifications.addInfo(message, options);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm90aWZpY2F0aW9ucy1hZGFwdGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkYXB0ZXJzL25vdGlmaWNhdGlvbnMtYWRhcHRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLHNEQU0yQjtBQU8zQixxRkFBcUY7QUFDckYsTUFBcUIsb0JBQW9CO0lBQ3ZDLDhFQUE4RTtJQUM5RSwrQ0FBK0M7SUFDeEMsTUFBTSxDQUFDLE1BQU0sQ0FDbEIsVUFBb0MsRUFDcEMsSUFBWSxFQUNaLFdBQW1CO1FBRW5CLFVBQVUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDMUYsVUFBVSxDQUFDLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDMUcsQ0FBQztJQUVELHFGQUFxRjtJQUNyRixFQUFFO0lBQ0YsOEVBQThFO0lBQzlFLHlFQUF5RTtJQUN6RSwwRUFBMEU7SUFDMUUscUNBQXFDO0lBQ3JDLHFEQUFxRDtJQUM5QyxNQUFNLENBQUMsb0JBQW9CLENBQ2hDLE1BQWdDLEVBQ2hDLElBQVksRUFDWixXQUFtQjtRQUVuQixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBQ3RDLE1BQU0sT0FBTyxHQUF3QjtnQkFDbkMsV0FBVyxFQUFFLElBQUk7Z0JBQ2pCLE1BQU0sRUFBRSxHQUFHLElBQUksSUFBSSxXQUFXLEVBQUU7YUFDakMsQ0FBQztZQUNGLElBQUksTUFBTSxDQUFDLE9BQU8sRUFBRTtnQkFDbEIsT0FBTyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztvQkFDM0MsSUFBSSxFQUFFLENBQUMsQ0FBQyxLQUFLO29CQUNiLFVBQVUsRUFBRSxHQUFHLEVBQUU7d0JBQ2YsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO3dCQUNYLElBQUksWUFBWSxJQUFJLElBQUksRUFBRTs0QkFDeEIsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDO3lCQUN4QjtvQkFDSCxDQUFDO2lCQUNGLENBQUMsQ0FBQyxDQUFDO2FBQ0w7WUFFRCxNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FDNUMsTUFBTSxDQUFDLElBQUksRUFDWCxNQUFNLENBQUMsT0FBTyxFQUNkLE9BQU8sQ0FBQyxDQUFDO1lBRVgsSUFBSSxZQUFZLElBQUksSUFBSSxFQUFFO2dCQUN4QixZQUFZLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRTtvQkFDN0IsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNoQixDQUFDLENBQUMsQ0FBQzthQUNKO1FBQ0gsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsd0VBQXdFO0lBQ3hFLEVBQUU7SUFDRix1RUFBdUU7SUFDdkUseUVBQXlFO0lBQ3pFLDBFQUEwRTtJQUMxRSxxQ0FBcUM7SUFDckMscURBQXFEO0lBQzlDLE1BQU0sQ0FBQyxhQUFhLENBQ3pCLE1BQXlCLEVBQ3pCLElBQVksRUFDWixXQUFtQjtRQUVuQix5QkFBeUIsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEVBQUU7WUFDckQsV0FBVyxFQUFFLElBQUk7WUFDakIsTUFBTSxFQUFFLEdBQUcsSUFBSSxJQUFJLFdBQVcsRUFBRTtTQUNqQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQseUVBQXlFO0lBQ3pFLCtDQUErQztJQUMvQyxFQUFFO0lBQ0YsMERBQTBEO0lBQzFELEVBQUU7SUFDRiw4RUFBOEU7SUFDdkUsTUFBTSxDQUFDLDhCQUE4QixDQUMxQyxVQUE2QjtRQUU3QixPQUFPO1lBQ0wsSUFBSSxFQUFFLFVBQVUsQ0FBQyxLQUFLO1NBQ3ZCLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFyRkQsdUNBcUZDO0FBRUQsU0FBUyxtQkFBbUIsQ0FDMUIsV0FBbUI7SUFFbkIsUUFBUSxXQUFXLEVBQUU7UUFDbkIsS0FBSyw0QkFBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sT0FBTyxDQUFDO1FBQ3ZDLEtBQUssNEJBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLFNBQVMsQ0FBQztRQUMzQyxPQUFPLENBQUMsQ0FBQyxPQUFPLE1BQU0sQ0FBQztLQUN4QjtBQUNILENBQUM7QUFFRCxTQUFTLHlCQUF5QixDQUNoQyxXQUFtQixFQUNuQixPQUFlLEVBQ2YsT0FBNEI7SUFFNUIsU0FBUyxXQUFXLENBQUMsSUFBcUI7UUFDeEMsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7UUFDN0QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksRUFBRSxDQUFDO1FBQy9ELE9BQU8sQ0FBQyxhQUFhO1lBQ25CLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxtQkFBbUIsQ0FBQyxXQUFXLENBQUM7WUFDbkQsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLE9BQU87WUFDN0IsV0FBVyxDQUFDLE1BQU0sS0FBSyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBQzFDLENBQUM7SUFDRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUU7UUFDM0QsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELFFBQVEsV0FBVyxFQUFFO1FBQ25CLEtBQUssNEJBQVcsQ0FBQyxLQUFLO1lBQ3BCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3ZELEtBQUssNEJBQVcsQ0FBQyxPQUFPO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ3pELEtBQUssNEJBQVcsQ0FBQyxHQUFHO1lBQ2xCLCtCQUErQjtZQUMvQixPQUFPLElBQUksQ0FBQztRQUNkLEtBQUssNEJBQVcsQ0FBQyxJQUFJLENBQUM7UUFDdEI7WUFDRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN2RDtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIE1lc3NhZ2VUeXBlLFxuICBNZXNzYWdlQWN0aW9uSXRlbSxcbiAgU2hvd01lc3NhZ2VQYXJhbXMsXG4gIFNob3dNZXNzYWdlUmVxdWVzdFBhcmFtcyxcbn0gZnJvbSAnLi4vbGFuZ3VhZ2VjbGllbnQnO1xuaW1wb3J0IHtcbiAgTm90aWZpY2F0aW9uLFxuICBOb3RpZmljYXRpb25PcHRpb25zLFxuICBOb3RpZmljYXRpb25FeHQsXG59IGZyb20gJ2F0b20nO1xuXG4vLyBQdWJsaWM6IEFkYXB0cyBBdG9tJ3MgdXNlciBub3RpZmljYXRpb25zIHRvIHRob3NlIG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBOb3RpZmljYXRpb25zQWRhcHRlciB7XG4gIC8vIFB1YmxpYzogQXR0YWNoIHRvIGEge0xhbmd1YWdlQ2xpZW50Q29ubmVjdGlvbn0gdG8gcmVjaWV2ZSBldmVudHMgaW5kaWNhdGluZ1xuICAvLyB3aGVuIHVzZXIgbm90aWZpY2F0aW9ucyBzaG91bGQgYmUgZGlzcGxheWVkLlxuICBwdWJsaWMgc3RhdGljIGF0dGFjaChcbiAgICBjb25uZWN0aW9uOiBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHByb2plY3RQYXRoOiBzdHJpbmcsXG4gICkge1xuICAgIGNvbm5lY3Rpb24ub25TaG93TWVzc2FnZSgobSkgPT4gTm90aWZpY2F0aW9uc0FkYXB0ZXIub25TaG93TWVzc2FnZShtLCBuYW1lLCBwcm9qZWN0UGF0aCkpO1xuICAgIGNvbm5lY3Rpb24ub25TaG93TWVzc2FnZVJlcXVlc3QoKG0pID0+IE5vdGlmaWNhdGlvbnNBZGFwdGVyLm9uU2hvd01lc3NhZ2VSZXF1ZXN0KG0sIG5hbWUsIHByb2plY3RQYXRoKSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IFNob3cgYSBub3RpZmljYXRpb24gbWVzc2FnZSB3aXRoIGJ1dHRvbnMgdXNpbmcgdGhlIEF0b20gbm90aWZpY2F0aW9ucyBBUEkuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtTaG93TWVzc2FnZVJlcXVlc3RQYXJhbXN9IHJlY2VpdmVkIGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlclxuICAvLyAgICAgICAgICAgIGluZGljYXRpbmcgdGhlIGRldGFpbHMgb2YgdGhlIG5vdGlmaWNhdGlvbiB0byBiZSBkaXNwbGF5ZWQuXG4gIC8vICogYG5hbWVgICAgVGhlIG5hbWUgb2YgdGhlIGxhbmd1YWdlIHNlcnZlciBzbyB0aGUgdXNlciBjYW4gaWRlbnRpZnkgdGhlXG4gIC8vICAgICAgICAgICAgY29udGV4dCBvZiB0aGUgbWVzc2FnZS5cbiAgLy8gKiBgcHJvamVjdFBhdGhgICAgVGhlIHBhdGggb2YgdGhlIGN1cnJlbnQgcHJvamVjdC5cbiAgcHVibGljIHN0YXRpYyBvblNob3dNZXNzYWdlUmVxdWVzdChcbiAgICBwYXJhbXM6IFNob3dNZXNzYWdlUmVxdWVzdFBhcmFtcyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcHJvamVjdFBhdGg6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxNZXNzYWdlQWN0aW9uSXRlbSB8IG51bGw+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIF9yZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IG9wdGlvbnM6IE5vdGlmaWNhdGlvbk9wdGlvbnMgPSB7XG4gICAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgICBkZXRhaWw6IGAke25hbWV9ICR7cHJvamVjdFBhdGh9YCxcbiAgICAgIH07XG4gICAgICBpZiAocGFyYW1zLmFjdGlvbnMpIHtcbiAgICAgICAgb3B0aW9ucy5idXR0b25zID0gcGFyYW1zLmFjdGlvbnMubWFwKChhKSA9PiAoe1xuICAgICAgICAgIHRleHQ6IGEudGl0bGUsXG4gICAgICAgICAgb25EaWRDbGljazogKCkgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShhKTtcbiAgICAgICAgICAgIGlmIChub3RpZmljYXRpb24gIT0gbnVsbCkge1xuICAgICAgICAgICAgICBub3RpZmljYXRpb24uZGlzbWlzcygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sXG4gICAgICAgIH0pKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgbm90aWZpY2F0aW9uID0gYWRkTm90aWZpY2F0aW9uRm9yTWVzc2FnZShcbiAgICAgICAgcGFyYW1zLnR5cGUsXG4gICAgICAgIHBhcmFtcy5tZXNzYWdlLFxuICAgICAgICBvcHRpb25zKTtcblxuICAgICAgaWYgKG5vdGlmaWNhdGlvbiAhPSBudWxsKSB7XG4gICAgICAgIG5vdGlmaWNhdGlvbi5vbkRpZERpc21pc3MoKCkgPT4ge1xuICAgICAgICAgIHJlc29sdmUobnVsbCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLy8gUHVibGljOiBTaG93IGEgbm90aWZpY2F0aW9uIG1lc3NhZ2UgdXNpbmcgdGhlIEF0b20gbm90aWZpY2F0aW9ucyBBUEkuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtTaG93TWVzc2FnZVBhcmFtc30gcmVjZWl2ZWQgZnJvbSB0aGUgbGFuZ3VhZ2Ugc2VydmVyXG4gIC8vICAgICAgICAgICAgaW5kaWNhdGluZyB0aGUgZGV0YWlscyBvZiB0aGUgbm90aWZpY2F0aW9uIHRvIGJlIGRpc3BsYXllZC5cbiAgLy8gKiBgbmFtZWAgICBUaGUgbmFtZSBvZiB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHNvIHRoZSB1c2VyIGNhbiBpZGVudGlmeSB0aGVcbiAgLy8gICAgICAgICAgICBjb250ZXh0IG9mIHRoZSBtZXNzYWdlLlxuICAvLyAqIGBwcm9qZWN0UGF0aGAgICBUaGUgcGF0aCBvZiB0aGUgY3VycmVudCBwcm9qZWN0LlxuICBwdWJsaWMgc3RhdGljIG9uU2hvd01lc3NhZ2UoXG4gICAgcGFyYW1zOiBTaG93TWVzc2FnZVBhcmFtcyxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgcHJvamVjdFBhdGg6IHN0cmluZyxcbiAgKTogdm9pZCB7XG4gICAgYWRkTm90aWZpY2F0aW9uRm9yTWVzc2FnZShwYXJhbXMudHlwZSwgcGFyYW1zLm1lc3NhZ2UsIHtcbiAgICAgIGRpc21pc3NhYmxlOiB0cnVlLFxuICAgICAgZGV0YWlsOiBgJHtuYW1lfSAke3Byb2plY3RQYXRofWAsXG4gICAgfSk7XG4gIH1cblxuICAvLyBQdWJsaWM6IENvbnZlcnQgYSB7TWVzc2FnZUFjdGlvbkl0ZW19IGZyb20gdGhlIGxhbmd1YWdlIHNlcnZlciBpbnRvIGFuXG4gIC8vIGVxdWl2YWxlbnQge05vdGlmaWNhdGlvbkJ1dHRvbn0gd2l0aGluIEF0b20uXG4gIC8vXG4gIC8vICogYGFjdGlvbkl0ZW1gIFRoZSB7TWVzc2FnZUFjdGlvbkl0ZW19IHRvIGJlIGNvbnZlcnRlZC5cbiAgLy9cbiAgLy8gUmV0dXJucyBhIHtOb3RpZmljYXRpb25CdXR0b259IGVxdWl2YWxlbnQgdG8gdGhlIHtNZXNzYWdlQWN0aW9uSXRlbX0gZ2l2ZW4uXG4gIHB1YmxpYyBzdGF0aWMgYWN0aW9uSXRlbVRvTm90aWZpY2F0aW9uQnV0dG9uKFxuICAgIGFjdGlvbkl0ZW06IE1lc3NhZ2VBY3Rpb25JdGVtLFxuICApIHtcbiAgICByZXR1cm4ge1xuICAgICAgdGV4dDogYWN0aW9uSXRlbS50aXRsZSxcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIG1lc3NhZ2VUeXBlVG9TdHJpbmcoXG4gIG1lc3NhZ2VUeXBlOiBudW1iZXIsXG4pOiBzdHJpbmcge1xuICBzd2l0Y2ggKG1lc3NhZ2VUeXBlKSB7XG4gICAgY2FzZSBNZXNzYWdlVHlwZS5FcnJvcjogcmV0dXJuICdlcnJvcic7XG4gICAgY2FzZSBNZXNzYWdlVHlwZS5XYXJuaW5nOiByZXR1cm4gJ3dhcm5pbmcnO1xuICAgIGRlZmF1bHQ6IHJldHVybiAnaW5mbyc7XG4gIH1cbn1cblxuZnVuY3Rpb24gYWRkTm90aWZpY2F0aW9uRm9yTWVzc2FnZShcbiAgbWVzc2FnZVR5cGU6IG51bWJlcixcbiAgbWVzc2FnZTogc3RyaW5nLFxuICBvcHRpb25zOiBOb3RpZmljYXRpb25PcHRpb25zLFxuKTogTm90aWZpY2F0aW9uIHwgbnVsbCB7XG4gIGZ1bmN0aW9uIGlzRHVwbGljYXRlKG5vdGU6IE5vdGlmaWNhdGlvbkV4dCk6IGJvb2xlYW4ge1xuICAgIGNvbnN0IG5vdGVEaXNtaXNzZWQgPSBub3RlLmlzRGlzbWlzc2VkICYmIG5vdGUuaXNEaXNtaXNzZWQoKTtcbiAgICBjb25zdCBub3RlT3B0aW9ucyA9IG5vdGUuZ2V0T3B0aW9ucyAmJiBub3RlLmdldE9wdGlvbnMoKSB8fCB7fTtcbiAgICByZXR1cm4gIW5vdGVEaXNtaXNzZWQgJiZcbiAgICAgIG5vdGUuZ2V0VHlwZSgpID09PSBtZXNzYWdlVHlwZVRvU3RyaW5nKG1lc3NhZ2VUeXBlKSAmJlxuICAgICAgbm90ZS5nZXRNZXNzYWdlKCkgPT09IG1lc3NhZ2UgJiZcbiAgICAgIG5vdGVPcHRpb25zLmRldGFpbCA9PT0gb3B0aW9ucy5kZXRhaWw7XG4gIH1cbiAgaWYgKGF0b20ubm90aWZpY2F0aW9ucy5nZXROb3RpZmljYXRpb25zKCkuc29tZShpc0R1cGxpY2F0ZSkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHN3aXRjaCAobWVzc2FnZVR5cGUpIHtcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLkVycm9yOlxuICAgICAgcmV0dXJuIGF0b20ubm90aWZpY2F0aW9ucy5hZGRFcnJvcihtZXNzYWdlLCBvcHRpb25zKTtcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLldhcm5pbmc6XG4gICAgICByZXR1cm4gYXRvbS5ub3RpZmljYXRpb25zLmFkZFdhcm5pbmcobWVzc2FnZSwgb3B0aW9ucyk7XG4gICAgY2FzZSBNZXNzYWdlVHlwZS5Mb2c6XG4gICAgICAvLyBjb25zb2xlLmxvZyhwYXJhbXMubWVzc2FnZSk7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICBjYXNlIE1lc3NhZ2VUeXBlLkluZm86XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBhdG9tLm5vdGlmaWNhdGlvbnMuYWRkSW5mbyhtZXNzYWdlLCBvcHRpb25zKTtcbiAgfVxufVxuIl19
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageclient_1 = require("../languageclient");
// Adapts Atom's user notifications to those of the language server protocol.
class LoggingConsoleAdapter {
    // Create a new {LoggingConsoleAdapter} that will listen for log messages
    // via the supplied {LanguageClientConnection}.
    //
    // * `connection` A {LanguageClientConnection} to the language server that will provide log messages.
    constructor(connection) {
        this._consoles = new Set();
        connection.onLogMessage(this.logMessage.bind(this));
    }
    // Dispose this adapter ensuring any resources are freed and events unhooked.
    dispose() {
        this.detachAll();
    }
    // Public: Attach this {LoggingConsoleAdapter} to a given {ConsoleApi}.
    //
    // * `console` A {ConsoleApi} that wants to receive messages.
    attach(console) {
        this._consoles.add(console);
    }
    // Public: Remove all {ConsoleApi}'s attached to this adapter.
    detachAll() {
        this._consoles.clear();
    }
    // Log a message using the Atom IDE UI Console API.
    //
    // * `params` The {LogMessageParams} received from the language server
    //            indicating the details of the message to be loggedd.
    logMessage(params) {
        switch (params.type) {
            case languageclient_1.MessageType.Error: {
                this._consoles.forEach((c) => c.error(params.message));
                return;
            }
            case languageclient_1.MessageType.Warning: {
                this._consoles.forEach((c) => c.warn(params.message));
                return;
            }
            case languageclient_1.MessageType.Info: {
                this._consoles.forEach((c) => c.info(params.message));
                return;
            }
            case languageclient_1.MessageType.Log: {
                this._consoles.forEach((c) => c.log(params.message));
                return;
            }
        }
    }
}
exports.default = LoggingConsoleAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRhcHRlcnMvbG9nZ2luZy1jb25zb2xlLWFkYXB0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSxzREFJMkI7QUFFM0IsNkVBQTZFO0FBQzdFLE1BQXFCLHFCQUFxQjtJQUd4Qyx5RUFBeUU7SUFDekUsK0NBQStDO0lBQy9DLEVBQUU7SUFDRixxR0FBcUc7SUFDckcsWUFBWSxVQUFvQztRQU54QyxjQUFTLEdBQW9CLElBQUksR0FBRyxFQUFFLENBQUM7UUFPN0MsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3RELENBQUM7SUFFRCw2RUFBNkU7SUFDdEUsT0FBTztRQUNaLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQsdUVBQXVFO0lBQ3ZFLEVBQUU7SUFDRiw2REFBNkQ7SUFDdEQsTUFBTSxDQUFDLE9BQW1CO1FBQy9CLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzlCLENBQUM7SUFFRCw4REFBOEQ7SUFDdkQsU0FBUztRQUNkLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDekIsQ0FBQztJQUVELG1EQUFtRDtJQUNuRCxFQUFFO0lBQ0Ysc0VBQXNFO0lBQ3RFLGtFQUFrRTtJQUMxRCxVQUFVLENBQUMsTUFBd0I7UUFDekMsUUFBUSxNQUFNLENBQUMsSUFBSSxFQUFFO1lBQ25CLEtBQUssNEJBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDdEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDckIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELE9BQU87YUFDUjtZQUNELEtBQUssNEJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7Z0JBQ3JELE9BQU87YUFDUjtTQUNGO0lBQ0gsQ0FBQztDQUNGO0FBcERELHdDQW9EQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnNvbGVBcGkgfSBmcm9tICdhdG9tLWlkZSc7XG5pbXBvcnQge1xuICBMYW5ndWFnZUNsaWVudENvbm5lY3Rpb24sXG4gIExvZ01lc3NhZ2VQYXJhbXMsXG4gIE1lc3NhZ2VUeXBlLFxufSBmcm9tICcuLi9sYW5ndWFnZWNsaWVudCc7XG5cbi8vIEFkYXB0cyBBdG9tJ3MgdXNlciBub3RpZmljYXRpb25zIHRvIHRob3NlIG9mIHRoZSBsYW5ndWFnZSBzZXJ2ZXIgcHJvdG9jb2wuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2dnaW5nQ29uc29sZUFkYXB0ZXIge1xuICBwcml2YXRlIF9jb25zb2xlczogU2V0PENvbnNvbGVBcGk+ID0gbmV3IFNldCgpO1xuXG4gIC8vIENyZWF0ZSBhIG5ldyB7TG9nZ2luZ0NvbnNvbGVBZGFwdGVyfSB0aGF0IHdpbGwgbGlzdGVuIGZvciBsb2cgbWVzc2FnZXNcbiAgLy8gdmlhIHRoZSBzdXBwbGllZCB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufS5cbiAgLy9cbiAgLy8gKiBgY29ubmVjdGlvbmAgQSB7TGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9ufSB0byB0aGUgbGFuZ3VhZ2Ugc2VydmVyIHRoYXQgd2lsbCBwcm92aWRlIGxvZyBtZXNzYWdlcy5cbiAgY29uc3RydWN0b3IoY29ubmVjdGlvbjogTGFuZ3VhZ2VDbGllbnRDb25uZWN0aW9uKSB7XG4gICAgY29ubmVjdGlvbi5vbkxvZ01lc3NhZ2UodGhpcy5sb2dNZXNzYWdlLmJpbmQodGhpcykpO1xuICB9XG5cbiAgLy8gRGlzcG9zZSB0aGlzIGFkYXB0ZXIgZW5zdXJpbmcgYW55IHJlc291cmNlcyBhcmUgZnJlZWQgYW5kIGV2ZW50cyB1bmhvb2tlZC5cbiAgcHVibGljIGRpc3Bvc2UoKTogdm9pZCB7XG4gICAgdGhpcy5kZXRhY2hBbGwoKTtcbiAgfVxuXG4gIC8vIFB1YmxpYzogQXR0YWNoIHRoaXMge0xvZ2dpbmdDb25zb2xlQWRhcHRlcn0gdG8gYSBnaXZlbiB7Q29uc29sZUFwaX0uXG4gIC8vXG4gIC8vICogYGNvbnNvbGVgIEEge0NvbnNvbGVBcGl9IHRoYXQgd2FudHMgdG8gcmVjZWl2ZSBtZXNzYWdlcy5cbiAgcHVibGljIGF0dGFjaChjb25zb2xlOiBDb25zb2xlQXBpKTogdm9pZCB7XG4gICAgdGhpcy5fY29uc29sZXMuYWRkKGNvbnNvbGUpO1xuICB9XG5cbiAgLy8gUHVibGljOiBSZW1vdmUgYWxsIHtDb25zb2xlQXBpfSdzIGF0dGFjaGVkIHRvIHRoaXMgYWRhcHRlci5cbiAgcHVibGljIGRldGFjaEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLl9jb25zb2xlcy5jbGVhcigpO1xuICB9XG5cbiAgLy8gTG9nIGEgbWVzc2FnZSB1c2luZyB0aGUgQXRvbSBJREUgVUkgQ29uc29sZSBBUEkuXG4gIC8vXG4gIC8vICogYHBhcmFtc2AgVGhlIHtMb2dNZXNzYWdlUGFyYW1zfSByZWNlaXZlZCBmcm9tIHRoZSBsYW5ndWFnZSBzZXJ2ZXJcbiAgLy8gICAgICAgICAgICBpbmRpY2F0aW5nIHRoZSBkZXRhaWxzIG9mIHRoZSBtZXNzYWdlIHRvIGJlIGxvZ2dlZGQuXG4gIHByaXZhdGUgbG9nTWVzc2FnZShwYXJhbXM6IExvZ01lc3NhZ2VQYXJhbXMpOiB2b2lkIHtcbiAgICBzd2l0Y2ggKHBhcmFtcy50eXBlKSB7XG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlLkVycm9yOiB7XG4gICAgICAgIHRoaXMuX2NvbnNvbGVzLmZvckVhY2goKGMpID0+IGMuZXJyb3IocGFyYW1zLm1lc3NhZ2UpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgY2FzZSBNZXNzYWdlVHlwZS5XYXJuaW5nOiB7XG4gICAgICAgIHRoaXMuX2NvbnNvbGVzLmZvckVhY2goKGMpID0+IGMud2FybihwYXJhbXMubWVzc2FnZSkpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBjYXNlIE1lc3NhZ2VUeXBlLkluZm86IHtcbiAgICAgICAgdGhpcy5fY29uc29sZXMuZm9yRWFjaCgoYykgPT4gYy5pbmZvKHBhcmFtcy5tZXNzYWdlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGNhc2UgTWVzc2FnZVR5cGUuTG9nOiB7XG4gICAgICAgIHRoaXMuX2NvbnNvbGVzLmZvckVhY2goKGMpID0+IGMubG9nKHBhcmFtcy5tZXNzYWdlKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==
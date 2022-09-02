// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

var __awaiter = void 0 && (void 0).__awaiter || function (thisArg, _arguments, P, generator) {
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : new P(function (resolve) {
        resolve(result.value);
      }).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const React = require("react");

class PostOffice extends React.Component {
  constructor(props) {
    super(props);

    this.handleMessages = ev => __awaiter(this, void 0, void 0, function* () {
      if (this.props) {
        const msg = ev.data;

        if (msg) {
          this.props.messageHandlers.forEach(h => {
            h.handleMessage(msg.type, msg.payload);
          });
        }
      }
    });
  }

  static canSendMessages() {
    if (PostOffice.acquireApi()) {
      return true;
    }

    return false;
  }

  static sendMessage(message) {
    if (PostOffice.canSendMessages()) {
      const api = PostOffice.acquireApi();

      if (api) {
        api.postMessage(message);
      }
    }
  }

  static acquireApi() {
    // Only do this once as it crashes if we ask more than once
    if (!PostOffice.vscodeApi && // tslint:disable-next-line:no-typeof-undefined
    typeof acquireVsCodeApi !== 'undefined') {
      PostOffice.vscodeApi = acquireVsCodeApi();
    }

    return PostOffice.vscodeApi;
  }

  componentDidMount() {
    window.addEventListener('message', this.handleMessages);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessages);
  }

  render() {
    return null;
  }

}

exports.PostOffice = PostOffice;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInBvc3RPZmZpY2UuanMiXSwibmFtZXMiOlsiX19hd2FpdGVyIiwidGhpc0FyZyIsIl9hcmd1bWVudHMiLCJQIiwiZ2VuZXJhdG9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJyZWplY3QiLCJmdWxmaWxsZWQiLCJ2YWx1ZSIsInN0ZXAiLCJuZXh0IiwiZSIsInJlamVjdGVkIiwicmVzdWx0IiwiZG9uZSIsInRoZW4iLCJhcHBseSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZXhwb3J0cyIsIlJlYWN0IiwicmVxdWlyZSIsIlBvc3RPZmZpY2UiLCJDb21wb25lbnQiLCJjb25zdHJ1Y3RvciIsInByb3BzIiwiaGFuZGxlTWVzc2FnZXMiLCJldiIsIm1zZyIsImRhdGEiLCJtZXNzYWdlSGFuZGxlcnMiLCJmb3JFYWNoIiwiaCIsImhhbmRsZU1lc3NhZ2UiLCJ0eXBlIiwicGF5bG9hZCIsImNhblNlbmRNZXNzYWdlcyIsImFjcXVpcmVBcGkiLCJzZW5kTWVzc2FnZSIsIm1lc3NhZ2UiLCJhcGkiLCJwb3N0TWVzc2FnZSIsInZzY29kZUFwaSIsImFjcXVpcmVWc0NvZGVBcGkiLCJjb21wb25lbnREaWRNb3VudCIsIndpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJjb21wb25lbnRXaWxsVW5tb3VudCIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJyZW5kZXIiXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTs7QUFDQSxJQUFJQSxTQUFTLEdBQUksVUFBUSxTQUFLQSxTQUFkLElBQTRCLFVBQVVDLE9BQVYsRUFBbUJDLFVBQW5CLEVBQStCQyxDQUEvQixFQUFrQ0MsU0FBbEMsRUFBNkM7QUFDckYsU0FBTyxLQUFLRCxDQUFDLEtBQUtBLENBQUMsR0FBR0UsT0FBVCxDQUFOLEVBQXlCLFVBQVVDLE9BQVYsRUFBbUJDLE1BQW5CLEVBQTJCO0FBQ3ZELGFBQVNDLFNBQVQsQ0FBbUJDLEtBQW5CLEVBQTBCO0FBQUUsVUFBSTtBQUFFQyxRQUFBQSxJQUFJLENBQUNO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LEdBQUc7QUFDaEJDLElBQUFBLE1BQU0sQ0FBQ0MsZ0JBQVAsQ0FBd0IsU0FBeEIsRUFBbUMsS0FBS3BCLGNBQXhDO0FBQ0g7O0FBQ0RxQixFQUFBQSxvQkFBb0IsR0FBRztBQUNuQkYsSUFBQUEsTUFBTSxDQUFDRyxtQkFBUCxDQUEyQixTQUEzQixFQUFzQyxLQUFLdEIsY0FBM0M7QUFDSDs7QUFDRHVCLEVBQUFBLE1BQU0sR0FBRztBQUNMLFdBQU8sSUFBUDtBQUNIOztBQTdDb0M7O0FBK0N6QzlCLE9BQU8sQ0FBQ0csVUFBUixHQUFxQkEsVUFBckIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbi8vIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS5cbid1c2Ugc3RyaWN0JztcbnZhciBfX2F3YWl0ZXIgPSAodGhpcyAmJiB0aGlzLl9fYXdhaXRlcikgfHwgZnVuY3Rpb24gKHRoaXNBcmcsIF9hcmd1bWVudHMsIFAsIGdlbmVyYXRvcikge1xuICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICBmdW5jdGlvbiBmdWxmaWxsZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3IubmV4dCh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yW1widGhyb3dcIl0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiBzdGVwKHJlc3VsdCkgeyByZXN1bHQuZG9uZSA/IHJlc29sdmUocmVzdWx0LnZhbHVlKSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUocmVzdWx0LnZhbHVlKTsgfSkudGhlbihmdWxmaWxsZWQsIHJlamVjdGVkKTsgfVxuICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7XG4gICAgfSk7XG59O1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuY29uc3QgUmVhY3QgPSByZXF1aXJlKFwicmVhY3RcIik7XG5jbGFzcyBQb3N0T2ZmaWNlIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgICAgICBzdXBlcihwcm9wcyk7XG4gICAgICAgIHRoaXMuaGFuZGxlTWVzc2FnZXMgPSAoZXYpID0+IF9fYXdhaXRlcih0aGlzLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24qICgpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnByb3BzKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbXNnID0gZXYuZGF0YTtcbiAgICAgICAgICAgICAgICBpZiAobXNnKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvcHMubWVzc2FnZUhhbmRsZXJzLmZvckVhY2goKGgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGguaGFuZGxlTWVzc2FnZShtc2cudHlwZSwgbXNnLnBheWxvYWQpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzdGF0aWMgY2FuU2VuZE1lc3NhZ2VzKCkge1xuICAgICAgICBpZiAoUG9zdE9mZmljZS5hY3F1aXJlQXBpKCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgc3RhdGljIHNlbmRNZXNzYWdlKG1lc3NhZ2UpIHtcbiAgICAgICAgaWYgKFBvc3RPZmZpY2UuY2FuU2VuZE1lc3NhZ2VzKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGFwaSA9IFBvc3RPZmZpY2UuYWNxdWlyZUFwaSgpO1xuICAgICAgICAgICAgaWYgKGFwaSkge1xuICAgICAgICAgICAgICAgIGFwaS5wb3N0TWVzc2FnZShtZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgYWNxdWlyZUFwaSgpIHtcbiAgICAgICAgLy8gT25seSBkbyB0aGlzIG9uY2UgYXMgaXQgY3Jhc2hlcyBpZiB3ZSBhc2sgbW9yZSB0aGFuIG9uY2VcbiAgICAgICAgaWYgKCFQb3N0T2ZmaWNlLnZzY29kZUFwaSAmJlxuICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXR5cGVvZi11bmRlZmluZWRcbiAgICAgICAgICAgIHR5cGVvZiBhY3F1aXJlVnNDb2RlQXBpICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgUG9zdE9mZmljZS52c2NvZGVBcGkgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFBvc3RPZmZpY2UudnNjb2RlQXBpO1xuICAgIH1cbiAgICBjb21wb25lbnREaWRNb3VudCgpIHtcbiAgICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCB0aGlzLmhhbmRsZU1lc3NhZ2VzKTtcbiAgICB9XG4gICAgY29tcG9uZW50V2lsbFVubW91bnQoKSB7XG4gICAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgdGhpcy5oYW5kbGVNZXNzYWdlcyk7XG4gICAgfVxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZXhwb3J0cy5Qb3N0T2ZmaWNlID0gUG9zdE9mZmljZTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXBvc3RPZmZpY2UuanMubWFwIl19
import { _ } from "@ncac/marionext-lodash";
import {
  DefaultEventMap,
  TEventMap,
  MyClassEventHandlerFunction,
  ThisEvents,
  RecordedClassEventHandlerFunction
} from "./types";
import { onApi } from "./on";

export const onceReducer = function <
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
>(
  events: ThisEvents<EventMap>,
  eventArgObj: {
    name: EventKey;
    callback: MyClassEventHandlerFunction<EventMap[EventKey]>;
    context: any;
  }
) {
  const callback = eventArgObj.callback;
  const eventName = eventArgObj.name;
  const context = eventArgObj.context;
  if (!callback) {
    return events;
  }
  const onceCallback = onceWrap(callback, this.off.bind(this, eventName));
  return onApi({
    events,
    name: eventName,
    callback: onceCallback,
    context,
    ctx: this
  });
};

export function onceWrap<
  EventMap extends DefaultEventMap,
  EventKey extends keyof EventMap
>(callback: MyClassEventHandlerFunction<EventMap[EventKey]>, offCallback) {
  const onceCallback: RecordedClassEventHandlerFunction<typeof callback> =
    _.once(function () {
      offCallback(onceCallback);
      return callback.apply(this, arguments);
    });
  onceCallback._callback = callback;
  return onceCallback;
}

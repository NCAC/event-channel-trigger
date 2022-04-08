import { AnyEventTrigger } from "./types";
import { ResultEventArgListening } from "./build-event-args";
import { onceWrap } from "./once";
import { listenToApi } from "./listen-to";

export const listenToOnceApi = function listenToOnceApi<
  ListenerObj extends AnyEventTrigger, //obj that is listened
  ListenObj extends AnyEventTrigger, // obj that listen to
  EventMap extends ListenerObj["TClassEventMap"],
  EventKey extends keyof EventMap
>(
  this: ListenerObj,
  listenToOnceApiParams: ResultEventArgListening<
    ListenerObj,
    ListenObj,
    EventMap,
    EventKey
  >
) {
  const callback = listenToOnceApiParams.callback;
  const listener = listenToOnceApiParams.listener;
  const eventName = listenToOnceApiParams.name;
  if (!callback) {
    return;
  }
  const offCallback = this.stopListening.bind(this, listener.obj, eventName);
  const onceCallback = onceWrap(callback, offCallback);
  listenToApi({
    name: eventName,
    callback: onceCallback,
    context: listenToOnceApiParams.context,
    listener
  });
};

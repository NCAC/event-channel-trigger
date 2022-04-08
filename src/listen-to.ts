import { _ } from "@ncac/marionext-lodash";
import { AnyEventTrigger, ThisEvents, Listenings } from "./types";
import { ResultEventArgListening } from "./build-event-args";
import { onApi } from "./on";

export const getListener = function <
  ListenObj extends AnyEventTrigger,
  ListenerObj extends AnyEventTrigger
>(obj: ListenObj, listenerObj: ListenerObj) {
  const listenId = obj._listenId || (obj._listenId = _.uniqueId("l"));
  obj._rdEvents = obj._rdEvents || {};
  const listeningTo: Listenings =
    listenerObj._rdListeningTo || (listenerObj._rdListeningTo = {});
  const listener = listeningTo[listenId];

  // This listenerObj is not listening to any other events on `obj` yet.
  // Setup the necessary references to track the listening callbacks.
  if (!listener) {
    const listenerId =
      listenerObj._listenId || (listenerObj._listenId = _.uniqueId("l"));
    listeningTo[listenId] = {
      obj,
      listenId,
      listenerId,
      listeningTo,
      count: 0
    };

    return listeningTo[listenId];
  }

  return listener;
};

export const listenToApi = function <
  ListenerObj extends AnyEventTrigger, //obj that is listened
  ListenObj extends AnyEventTrigger, // obj that listen to
  EventMap extends ListenerObj["TClassEventMap"],
  EventKey extends keyof EventMap
>(
  listenToApiParams: ResultEventArgListening<
    ListenerObj,
    ListenObj,
    EventMap,
    EventKey
  >
) {
  const callback = listenToApiParams.callback;
  const listener = listenToApiParams.listener;
  const eventName = listenToApiParams.name;
  if (!listenToApiParams.callback) {
    return;
  }

  const { obj, listenerId } = listenToApiParams.listener;
  const listeners = obj._rdListeners || (obj._rdListeners = {});
  const context = listenToApiParams.context;
  obj._rdEvents = onApi<EventMap, EventKey>({
    events: obj._rdEvents as ThisEvents<EventMap>,
    name: eventName,
    callback,
    context,
    listener
  });
  listeners[listenerId] = listener;
  listener.count++;

  // Call `on` for interop
  obj.on(eventName as string, callback, context, { _rdInternal: true });
};

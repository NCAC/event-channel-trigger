import {
  Listenings,
  DefaultEventMap,
  TEventMap,
  ThisEvents,
  MyClassEventHandlerFunction
} from "./types";

export const cleanupListener = function (
  cleanUpListenerParams: Listenings[string]
) {
  const listeningTo = cleanUpListenerParams.listeningTo;
  const listenId = cleanUpListenerParams.listenId;
  const listenerId = cleanUpListenerParams.listenerId;
  const ListenedObj = cleanUpListenerParams.obj;
  delete listeningTo[listenId];
  delete ListenedObj._rdListeners[listenerId];
};

// The reducing API that removes a callback from the `events` object.
export const offReducer = function <
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
>(
  events: ThisEvents<EventMap>,
  eventArgObj: {
    name: EventKey;
    callback: MyClassEventHandlerFunction<EventMap[EventKey]>;
    context: any;
  }
): ThisEvents<EventMap> {
  const eventNames = eventArgObj.name
    ? [eventArgObj.name]
    : Object.keys(events);
  const callback = eventArgObj.callback;
  const context = eventArgObj.context;

  (eventNames as EventKey[]).forEach((eventKey) => {
    const handlers = events[eventKey];
    // Bail out if there are no events stored.
    if (!handlers) {
      return;
    }
    events[eventKey] = handlers.reduce((remaininig, handler) => {
      if (
        (callback &&
          callback !== handler.callback &&
          callback !== handler.callback._callback) ||
        (context && context !== handler.context)
      ) {
        remaininig.push(handler);
        return remaininig;
      }

      // If not including event, clean up any related listener
      if (handler.listener) {
        const listener = handler.listener;
        listener.count--;
        if (!listener.count) {
          cleanupListener(listener);
        }
      }
      return remaininig;
    }, []);

    if (!events[eventKey].length) {
      delete events[eventKey];
    }
  });

  return events;
};

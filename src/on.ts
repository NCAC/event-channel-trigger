import {
  DefaultEventMap,
  ThisEvents,
  TEventMap,
  MyClassEventHandlerFunction
} from "./types";

// The reducing API that adds a callback to the `events` object.
type OnApiParams<
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
> = {
  events: ThisEvents<EventMap>;
  name: EventKey;
  callback: MyClassEventHandlerFunction<EventMap[EventKey]>;
  context: any;
  ctx?: any;
  listener?: any;
};

export const onApi = function <
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
>(params: OnApiParams<EventMap, EventKey>) {
  const events = params.events;
  const handlers = events[params.name] || (params.events[params.name] = []);
  handlers.push({
    callback: params.callback,
    context: params.context,
    ctx: params.context || params.ctx,
    listener: params.listener
  });
  return events;
};

export const onReducer = function <
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
  if (!eventArgObj.callback) {
    return events;
  }
  const onApiArgs = {
    events: events,
    name: eventArgObj.name,
    callback: eventArgObj.callback,
    context: eventArgObj.context,
    ctx: this
  };
  return onApi<EventMap, EventKey>(onApiArgs);
};

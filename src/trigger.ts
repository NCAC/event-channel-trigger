import { TParameters } from "@ncac/marionext-types";
import { callEventHandler } from "./call-event-handler";
import { DefaultEventMap, TEventMap, ThisEvents } from "./types";

export const triggerApi = function triggerApi<
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
>(triggerApiParams: {
  events: ThisEvents<EventMap>;
  name: EventKey;
  args: TParameters<EventMap[EventKey]>;
}) {
  const events = triggerApiParams.events;
  const eventName = triggerApiParams.name;
  const objEvents = events[eventName];
  const allEvents = objEvents && events.all ? events.all.slice() : events.all;
  const args = triggerApiParams.args;
  if (objEvents) {
    triggerEvents(objEvents, args);
  }
  if (allEvents) {
    // special case for event "all"
    triggerEvents(allEvents, [eventName].concat(args) as any);
  }
};
export const triggerEvents = function triggerEvents<
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap
>(
  events: ThisEvents<EventMap>[EventKey],
  args: TParameters<EventMap[EventKey]>
) {
  events.forEach((event) => {
    callEventHandler(event.callback, event.ctx, args);
  });
};

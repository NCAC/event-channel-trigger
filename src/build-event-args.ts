import { _ } from "@ncac/marionext-lodash";

import {
  DefaultEventMap,
  TEventMap,
  MyClassEventHandlerFunction,
  AnyEventTrigger,
  Listenings
} from "./types";

type ResultEventArg<
  EventMap extends DefaultEventMap,
  EventKey extends keyof EventMap
> = {
  name: EventKey;
  callback: EventMap[EventKey];
  context?: any;
  listener?: any;
};

type ResultListener<ListenObj extends AnyEventTrigger> = {
  obj: ListenObj;
  listenId: string;
  listenerId: string;
  listeningTo: Listenings;
  count: number;
};

export type ResultEventArgListening<
  ListenerObj extends AnyEventTrigger,
  ListenObj extends AnyEventTrigger,
  EventMap extends ListenerObj["TClassEventMap"],
  EventKey extends keyof EventMap
> = {
  name: EventKey;
  callback: MyClassEventHandlerFunction<EventMap[EventKey]>;
  context: ListenObj;
  listener: ResultListener<ListenerObj>;
};
type ResultEventArgs<
  EventMap extends Partial<DefaultEventMap>,
  EventKey extends keyof EventMap
> = ResultEventArg<EventMap, EventKey>[];

export function buildEventArgs<
  EventMap extends Partial<DefaultEventMap>,
  EventKey extends keyof EventMap
>(
  name: EventKey | EventMap,
  callback?: EventMap[EventKey],
  context?: any,
  listener?: any
): ResultEventArgs<EventMap, EventKey> {
  if (name && typeof name === "object") {
    const EventKeys = Object.keys(name);
    const result = EventKeys.reduce<ResultEventArgs<EventMap, EventKey>>(
      (eventArgs, key) => {
        return eventArgs.concat(
          buildEventArgs<EventMap, EventKey>(
            key as EventKey,
            name[key] as unknown as EventMap[EventKey],
            context || callback,
            listener
          )
        );
      },
      []
    );
    return result;
  }

  return [{ name: name as EventKey, callback, context, listener }];
}

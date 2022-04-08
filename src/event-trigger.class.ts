import { TParameters, ElementType } from "@ncac/marionext-types";
import { _ } from "@ncac/marionext-lodash";

import { buildEventArgs, ResultEventArgListening } from "./build-event-args";
import {
  DefaultEventMap,
  TEventMap,
  ExtractMethodName,
  ThisEvents,
  MyClassEventHandlerFunction,
  Listenings,
  AnyEventTrigger
} from "./types";

import { onReducer } from "./on";
import { cleanupListener, offReducer } from "./off";
import { getListener, listenToApi } from "./listen-to";
import { onceReducer } from "./once";
import { listenToOnceApi } from "./listen-to-once";
import { triggerApi } from "./trigger";

export type FunctionPropertyNameAsEventKey<
  ChildEventTrigger extends EventTrigger<ChildEventTrigger, ChildEventMap>,
  ChildEventMap extends TEventMap<DefaultEventMap>,
  ChildEventKey extends keyof ChildEventMap,
  OwnClassMethods extends ElementType<typeof EventTriggerProps>
> = Exclude<
  EventFunctionPropertyNames<ChildEventTrigger, ChildEventMap, ChildEventKey>,
  OwnClassMethods
>;

export const EventTriggerProps = [
  "TClassEventMap",
  "_rdEvents",
  "_rdListeners",
  "_rdListeningTo",
  "_listenId",
  "on",
  "off",
  "once",
  "trigger",
  "listenTo",
  "listenToOnce",
  "stopListening",
  "triggerMethod"
] as const;

export type EventFunctionPropertyNames<
  ChildEventTrigger extends EventTrigger<ChildEventTrigger, ChildEventMap>,
  ChildEventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof ChildEventMap
> = {
  [K in keyof ChildEventTrigger]: ChildEventTrigger[K] extends MyClassEventHandlerFunction<
    ChildEventMap[EventKey]
  >
    ? K
    : never;
}[keyof ChildEventTrigger];

const methodCache: {
  [eventName: string]: ExtractMethodName<typeof eventName>;
} = {};
const triggerMethodSplitter = /(^|:)(\w)/gi;
// take the event section ("section1:section2:section3")
// and turn it in to uppercase name onSection1Section2Section3
function getEventName(match, prefix, eventName: string) {
  return eventName.toUpperCase();
}
const getOnMethodName = function getOnMethodName<
  EventMap extends TEventMap<DefaultEventMap>,
  EventKey extends keyof EventMap & string
>(event: EventKey): ExtractMethodName<EventKey> {
  if (!methodCache[event]) {
    methodCache[event] = ("on" +
      event.replace(
        triggerMethodSplitter,
        getEventName
      )) as ExtractMethodName<EventKey>;
  }

  return methodCache[event] as ExtractMethodName<EventKey>;
};

export abstract class EventTrigger<
  ChildEventTrigger extends EventTrigger<ChildEventTrigger, ChildEventMap>,
  ChildEventMap extends TEventMap<DefaultEventMap>
> {
  readonly TClassEventMap: ChildEventMap;

  _rdEvents: ThisEvents<ChildEventMap>;
  _rdListeners: Listenings;
  _rdListeningTo: Listenings;

  _listenId: string;

  /**
   * on()
   * ------
   * Bind an event to a `callback` function
   */
  on<EventKey extends keyof ChildEventMap>(
    events: EventKey,
    callback: ChildEventMap[EventKey],
    context?: any,
    opts?: { _rdInternal: boolean }
  ): this | void;
  on<EventKey extends keyof ChildEventMap>(events: ChildEventMap): this | void;
  on<EventKey extends keyof ChildEventMap>(
    events: EventKey | ChildEventMap,
    callback?: ChildEventMap[EventKey],
    context?: any,
    opts?: { _rdInternal: boolean }
  ) {
    if (opts && opts._rdInternal) {
      return;
    }
    const eventArgs = buildEventArgs(events, callback, context);
    this._rdEvents = eventArgs.reduce(
      onReducer.bind(this),
      this._rdEvents || {}
    );
    return this;
  }

  /**
   * off()
   * --------
   * Remove one or many callbacks. If `context` is null, removes all
   * callbacks with that function. If `callback` is null, removes all
   * callbacks for the event. If `eventName` is null, removes all bound
   * callbacks for all events.
   * -------
   * Examples :
   * `this.off()` removes all callback from all EventKeys
   * `this.off("eventName", callbackFn, [context])` remove callbackFn (with context?) from eventKey "eventName"
   * `this.off("eventName")` remove all callbackFn from eventKey "eventName"
   * `this.off(eventMap)` from an eventMap given, remove eventKeys and callbackFns
   */
  off<EventKey extends keyof ChildEventMap>(
    eventName: EventKey,
    callback?: ChildEventMap[EventKey],
    context?: any,
    opts?: { _rdInternal: boolean }
  ): this | void;
  off<EventKey extends keyof ChildEventMap>(eventName: ChildEventMap): this;
  off(): this;
  off<EventKey extends keyof ChildEventMap>(
    eventName?: EventKey | ChildEventMap,
    callback?: ChildEventMap[EventKey],
    context?: any,
    opts?: { _rdInternal: boolean }
  ) {
    if (!this._rdEvents) {
      return this;
    }
    if (opts && opts._rdInternal) {
      return;
    }
    // Delete all event listeners and "drop" events.
    if (!eventName && !context && !callback) {
      this._rdEvents = void 0;
      const listeners = this._rdListeners;
      Object.keys(listeners).forEach((listenerId) => {
        cleanupListener(listeners[listenerId]);
      });
      return this;
    }
    const eventArgs = buildEventArgs(eventName, callback, context);
    this._rdEvents = eventArgs.reduce(offReducer.bind(this), this._rdEvents);
    return this;
  }

  /**
   * once()
   * --------
   * Bind an event to only be triggered a single time. After the first time
   * the callback is invoked, its listener will be removed.
   *
   */
  once<EventKey extends keyof ChildEventMap>(
    eventName: EventKey,
    callback: ChildEventMap[EventKey],
    context?: any
  ): this;
  once(eventName: ChildEventMap): this;
  once<EventKey extends keyof ChildEventMap>(
    eventName: EventKey | ChildEventMap,
    callback?: ChildEventMap[EventKey],
    context?: any
  ): this {
    const eventArgs = buildEventArgs(eventName, callback, context);
    this._rdEvents = eventArgs.reduce(
      onceReducer.bind(this),
      this._rdEvents || {}
    );
    return this;
  }

  /**
   * listenTo()
   * ----
   * Inversion-of-control versions of `on`. Tell *this* object to listen to
   * an event in another object... keeping track of what it's listening to
   * for easier unbinding later.
   */
  listenTo<
    ListenObj extends AnyEventTrigger,
    ListenEventMap extends ListenObj["TClassEventMap"],
    ListenEventKey extends keyof ListenEventMap,
    ListenCallback extends ListenEventMap[ListenEventKey]
  >(
    obj: ListenObj,
    eventName: ListenEventKey | ListenEventMap,
    callback?: ListenCallback
  ): this {
    if (!obj) {
      return this;
    }
    const listener = getListener<ListenObj, ChildEventTrigger>(
      obj,
      this as unknown as ChildEventTrigger
    );
    const eventArgs = buildEventArgs<ListenEventMap, ListenEventKey>(
      eventName,
      callback,
      this,
      listener
    );
    eventArgs.forEach((eventArg) => {
      listenToApi(
        eventArg as unknown as ResultEventArgListening<
          ListenObj,
          ChildEventTrigger,
          ListenEventMap,
          ListenEventKey
        >
      );
    });
  }

  /**
   * listenToOnce()
   * ------
   * Inversion-of-control versions of `once`.
   */
  listenToOnce<
    ListenObj extends AnyEventTrigger,
    ListenEventMap extends ListenObj["TClassEventMap"],
    ListenEventKey extends keyof ListenEventMap,
    ListenCallback extends ListenEventMap[ListenEventKey]
  >(obj: ListenObj, eventName: ListenEventKey, callback: ListenCallback): this {
    if (!obj) {
      return this;
    }

    const listener = getListener<ListenObj, ChildEventTrigger>(
      obj,
      this as unknown as ChildEventTrigger
    );
    const eventArgs = buildEventArgs<ListenEventMap, ListenEventKey>(
      eventName,
      callback,
      this,
      listener
    );
    const boundListenToOnceApi = listenToOnceApi.bind(this);
    eventArgs.forEach((eventArg) => {
      boundListenToOnceApi(eventArg);
    });
    return this;
  }

  /**
   *
   * stopListening()
   * -----
   * Tell `this` to stop listening to either specific events ... or
   * to every object it's currently listening to.
   */
  stopListening<
    ListenObj extends AnyEventTrigger,
    ListenEventMap extends ListenObj["TClassEventMap"],
    ListenEventKey extends keyof ListenEventMap,
    ListenCallback extends ListenEventMap[ListenEventKey]
  >(
    obj?: ListenObj,
    eventName?: ListenEventKey | ListenEventMap,
    callback?: ListenCallback
  ): this {
    const listeningTo = this._rdListeningTo;
    if (!listeningTo) {
      return this;
    }
    const eventArgs = buildEventArgs<ListenEventMap, ListenEventKey>(
      eventName,
      callback,
      this
    );
    const listenerIds = obj ? [obj._listenId] : Object.keys(listeningTo);
    for (let i = 0; i < listenerIds.length; i += 1) {
      const listener = listeningTo[listenerIds[i]];
      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listener) {
        break;
      }
      eventArgs.forEach((eventArg) => {
        const listenToObj = listener.obj;
        const events = listenToObj._rdEvents as ThisEvents<ListenEventMap>;
        if (!events) {
          return;
        }
        listenToObj._rdEvents = offReducer<ListenEventMap, ListenEventKey>(
          events,
          eventArg as unknown as ResultEventArgListening<
            ListenObj,
            ChildEventTrigger,
            ListenEventMap,
            ListenEventKey
          >
        );
      });
    }
    return this;
  }

  /**
   * trigger()
   * -------
   *
   */
  trigger<EventKey extends keyof ChildEventMap>(
    eventName: EventKey,
    ...args: TParameters<ChildEventMap[EventKey]>
  ): this;
  trigger<EventKey extends keyof ChildEventMap>(
    eventName: ChildEventMap,
    ...args: undefined
  ): this;
  trigger<EventKey extends keyof ChildEventMap>(
    eventName: EventKey | ChildEventMap,
    ...args: TParameters<ChildEventMap[EventKey]> | undefined
  ): this {
    if (!this._rdEvents) {
      return this;
    }
    triggerApi<ChildEventMap, EventKey>({
      events: this._rdEvents,
      name: eventName as EventKey,
      args
    });
    return this;
  }

  /**
   * triggerMethod
   * -------
   */
  triggerMethod<EventKey extends keyof ChildEventMap>(
    eventName: EventKey,
    ...args: TParameters<ChildEventMap[EventKey]> | unknown[] // FIX triggerMethod(this, options) :( ???
  ): void {
    const methodName = getOnMethodName(eventName as string);
    const method = this[methodName];
    let result;
    // call the onMethodName if it exists
    if (_.isFunction(method)) {
      // pass all args, except the event name
      result = method.apply(this, args);
    }
    // trigger the event
    this.trigger.apply(this, arguments);
  }
}

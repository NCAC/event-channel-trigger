import {
  TParameters,
  AnyFunction,
  ElementType,
  FunctionPropertyNames
} from "@ncac/marionext-types";
type FunctionPropertyNameAsEventKey<
  ChildEventTrigger extends EventTrigger<ChildEventTrigger, ChildEventMap>,
  ChildEventMap extends TEventMap<DefaultEventMap>,
  ChildEventKey extends keyof ChildEventMap,
  OwnClassMethods extends ElementType<typeof EventTriggerProps>
> = Exclude<
  EventFunctionPropertyNames<ChildEventTrigger, ChildEventMap, ChildEventKey>,
  OwnClassMethods
>;
declare const EventTriggerProps: readonly [
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
];
type EventFunctionPropertyNames<
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
declare abstract class EventTrigger<
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
    opts?: {
      _rdInternal: boolean;
    }
  ): this | void;
  on<EventKey extends keyof ChildEventMap>(events: ChildEventMap): this | void;
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
    opts?: {
      _rdInternal: boolean;
    }
  ): this | void;
  off<EventKey extends keyof ChildEventMap>(eventName: ChildEventMap): this;
  off(): this;
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
  ): this;
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
  >(obj: ListenObj, eventName: ListenEventKey, callback: ListenCallback): this;
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
  ): this;
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
  /**
   * triggerMethod
   * -------
   */
  triggerMethod<EventKey extends keyof ChildEventMap>(
    eventName: EventKey,
    ...args: TParameters<ChildEventMap[EventKey]> | unknown[] // FIX triggerMethod(this, options) :( ???
  ): void;
}
/**
 * AnyClassEventHandlerFunction : any function that return void
 */
type AnyClassEventHandlerFunction = (...args: any[]) => void;
type MyClassEventHandlerFunction<
  F extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction
> = (...args: TParameters<F>) => ReturnType<F>;
type RecordedClassEventHandlerFunction<
  F extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction,
  G extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction
> = MyClassEventHandlerFunction<F> & {
  _callback?: G;
};
/**
 * DefaultEventMap
 * -----
 * An object with key: `string` and value: `AnyClassEventHandlerFunction`
 *
 */
interface DefaultEventMap {
  [K: string]: AnyClassEventHandlerFunction;
}
type TEventMap<EventMap extends DefaultEventMap> = {
  [K in keyof EventMap]: MyClassEventHandlerFunction<EventMap[K]>;
} & {
  all: (eventName: string, ...args: any[]) => void;
};
interface RecordedEvent<
  E extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction
> {
  callback: RecordedClassEventHandlerFunction<E>;
  context: any;
  ctx: any;
  listening?: any;
  listener?: any;
}
type ThisEvents<
  EventMap extends TEventMap<DefaultEventMap> = TEventMap<DefaultEventMap>
> = {
  [K in keyof EventMap]?: RecordedEvent<EventMap[K]>[];
};
type MyFunction<F extends AnyFunction = AnyFunction> = (
  ...args: TParameters<F>
) => ReturnType<F>;
/**
 * ExtractMethodName
 * ----
 * from a string "wordA:wordB:wordC" return type "onWordAWordBWordC" for triggerMethod()
 */
type ExtractMethodName<TriggerMethodString extends any> =
  TriggerMethodString extends `${infer Section1}:${infer Section2}:${infer Section3}:${infer Section4}`
    ? `on${Capitalize<Section1>}${Capitalize<Section2>}${Capitalize<Section3>}${Capitalize<Section4>}`
    : TriggerMethodString extends `${infer Section1}:${infer Section2}:${infer Section3}`
    ? `on${Capitalize<Section1>}${Capitalize<Section2>}${Capitalize<Section3>}`
    : TriggerMethodString extends `${infer Section1}:${infer Section2}`
    ? `on${Capitalize<Section1>}${Capitalize<Section2>}`
    : TriggerMethodString extends `${infer Section1}`
    ? `on${Capitalize<Section1>}`
    : TriggerMethodString extends string
    ? `on${Capitalize<TriggerMethodString>}`
    : never;
type requestReturn<R> = R extends void ? never : R;
type MyRequestFunction<F extends AnyFunction = AnyFunction> = (
  ...args: TParameters<F>
) => requestReturn<ReturnType<F>>;
interface EventHandler<
  Handler extends AnyFunction = AnyFunction,
  Callback extends MyFunction = AnyFunction
> extends MyFunction<Handler> {
  _callback?: Callback;
}
interface RequestHandler<
  Handler extends AnyFunction = AnyFunction,
  Callback extends MyFunction = AnyFunction
> extends MyRequestFunction<Handler> {
  _callback?: Callback;
}
interface DefaultRequestMap {
  [key: string]: RequestHandler;
}
type TRequestMap<EventMap extends DefaultRequestMap> = {
  [K in keyof EventMap]: MyRequestFunction<EventMap[K]>;
};
interface RecordedRequest<E extends MyRequestFunction> {
  callback: RequestHandler<E>;
  context: any;
}
type ThisRequests<RequestMap extends DefaultRequestMap> = {
  [K in keyof RequestMap]?: RecordedRequest<RequestMap[K]>;
};
/**
 * Listening : interface for internal `_rdListeners` & `_rdListeningTo` properties
 */
type Listenings = {
  [key: string]: {
    obj: AnyEventTrigger;
    listenId: string;
    listenerId: string;
    listeningTo?: Listenings;
    count: number;
  };
};
interface AnyEventTrigger<
  ObjEventMap extends TEventMap<DefaultEventMap> = TEventMap<DefaultEventMap>
> extends EventTrigger<AnyEventTrigger<ObjEventMap>, ObjEventMap> {
  [key: string]: any;
}
type channelActions = ("reply" | "replyOnce" | "stopReplying") &
  FunctionPropertyNames<Channel>;
declare class Channel<
  ChannelEventMap extends TEventMap<DefaultEventMap> = TEventMap<DefaultEventMap>,
  ChannelRequestMap extends TRequestMap<DefaultRequestMap> = TRequestMap<DefaultRequestMap>
> extends EventTrigger<
  Channel<ChannelEventMap, ChannelRequestMap>,
  ChannelEventMap
> {
  readonly TClassRequestsMap: ChannelRequestMap;
  constructor(channelName: string, shouldDebug?: boolean);
  private _debug;
  private _channelName;
  get channelName(): string;
  private _rdRequests;
  request<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey
  ): ReturnType<ChannelRequestMap[RequestKey]>;
  // Set up a handler for a request
  reply<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey,
    callback: ChannelRequestMap[RequestKey],
    context?: AnyEventTrigger
  ): this;
  reply<RequestKey extends keyof ChannelRequestMap>(
    requestName: ChannelRequestMap,
    callback: AnyEventTrigger
  ): this;
  // Set up a handler that can only be requested once
  replyOnce<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey,
    callback: ChannelRequestMap[RequestKey],
    context: AnyEventTrigger
  ): this;
  replyOnce<RequestKey extends keyof ChannelRequestMap>(
    requestName: ChannelRequestMap,
    callback: AnyEventTrigger
  ): this;
  // Remove handler(s)
  stopReplying<RequestKey extends keyof ChannelRequestMap>(
    requestName?: RequestKey,
    callback?: ChannelRequestMap[RequestKey],
    context?: AnyEventTrigger
  ): this;
  stopReplying<RequestKey extends keyof ChannelRequestMap>(
    requestName?: ChannelRequestMap,
    callback?: AnyEventTrigger
  ): this;
  // A helper used by `off` methods to the handler from the store
  private _removeHandler;
  private _removeHandlers;
  private reset;
}
interface RadioMixinOptions {
  // Defines the Radio channel that will be used for the requests and/or
  // events.
  channelName?: string;
  // Defines an events hash with the events to be listened and its respective
  // handlers.
  radioEvents?: any;
  // Defines an events hash with the requests to be replied and its respective
  // handlers
  radioRequests?: any;
}
/**
 * _Radio is a singleton
 */
declare class RadioConstructor {
  private static instance;
  static getInstance(): RadioConstructor;
  private constructor();
  protected _channels: {
    [key: string]: Channel;
  };
  /**
   * Radio.channel(channelName: string)
   * --------
   * @returns the Channel with channelName
   * if the Channel does not exist, creates a new one
   * else, returns the existing channel
   */
  channel<
    EventMap extends TEventMap<DefaultEventMap>,
    RequestMap extends TRequestMap<DefaultRequestMap>
  >(channelName: string): Channel<EventMap, RequestMap>;
  private _shouldDebug;
  setDebug(shouldDebug?: boolean): void;
}
declare const Radio: RadioConstructor;
type TargetObjectEventMap<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  EventMap extends TargetObject["TClassEventMap"],
  Methods extends FunctionPropertyNames<SourceObject> = FunctionPropertyNames<SourceObject>
> = Partial<{
  [Key in keyof EventMap]:
    | keyof Methods
    | MyClassEventHandlerFunction<EventMap[Key]>;
}>;
type TargetObjectRequestsMap<
  SourceObject extends AnyEventTrigger,
  TargetChannel extends Channel,
  ChannelEventMap extends TargetChannel["TClassRequestsMap"],
  Methods extends FunctionPropertyNames<SourceObject> = FunctionPropertyNames<SourceObject>
> = Partial<{
  [Key in keyof ChannelEventMap]:
    | keyof Methods
    | MyClassEventHandlerFunction<ChannelEventMap[Key]>;
}>;
declare function bindEvents<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  TargetEventMap extends TargetObject["TClassEventMap"]
>(
  source: SourceObject,
  target: TargetObject,
  targetEventMap: TargetObjectEventMap<
    SourceObject,
    TargetObject,
    TargetEventMap
  >
): SourceObject;
declare function unbindEvents<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  TargetEventMap extends TargetObject["TClassEventMap"]
>(
  source: SourceObject,
  target: TargetObject,
  targetEventMap?: TargetEventMap
): SourceObject;
declare function bindRequests<
  SourceObject extends AnyEventTrigger,
  TargetChannel extends Channel,
  TargetRequestsMap extends TargetChannel["TClassRequestsMap"]
>(
  source: SourceObject,
  targetChannel: TargetChannel,
  bindings: TargetObjectRequestsMap<
    SourceObject,
    TargetChannel,
    TargetRequestsMap
  >
): SourceObject;
declare function unbindRequests<
  SourceObject extends AnyEventTrigger,
  TargetChannel extends Channel,
  TargetRequestsMap extends TargetChannel["TClassRequestsMap"]
>(
  source: SourceObject,
  targetChannel: TargetChannel,
  bindings?: TargetObjectRequestsMap<
    SourceObject,
    TargetChannel,
    TargetRequestsMap
  >
): SourceObject;
declare function normalizeBindings<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  TargetEventMap extends TargetObject["TClassEventMap"]
>(
  source: SourceObject,
  hash: TargetObjectEventMap<SourceObject, TargetObject, TargetEventMap>
): TargetObjectEventMap<SourceObject, TargetObject, TargetEventMap>;
declare function normalizeBindings<
  SourceObject extends AnyEventTrigger,
  TargetObject extends Channel,
  TargetRequestMap extends TargetObject["TClassRequestsMap"]
>(
  source: SourceObject,
  hash: TargetObjectRequestsMap<SourceObject, TargetObject, TargetRequestMap>
): TargetObjectRequestsMap<SourceObject, TargetObject, TargetRequestMap>;
export {
  AnyClassEventHandlerFunction,
  MyClassEventHandlerFunction,
  RecordedClassEventHandlerFunction,
  DefaultEventMap,
  TEventMap,
  RecordedEvent,
  ThisEvents,
  ExtractMethodName,
  MyRequestFunction,
  EventHandler,
  RequestHandler,
  DefaultRequestMap,
  TRequestMap,
  RecordedRequest,
  ThisRequests,
  Listenings,
  AnyEventTrigger,
  FunctionPropertyNameAsEventKey,
  EventTriggerProps,
  EventFunctionPropertyNames,
  EventTrigger,
  channelActions,
  Channel,
  RadioMixinOptions,
  Radio,
  TargetObjectEventMap,
  TargetObjectRequestsMap,
  bindEvents,
  unbindEvents,
  bindRequests,
  unbindRequests,
  normalizeBindings
};

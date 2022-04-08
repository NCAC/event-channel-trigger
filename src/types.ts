import { TParameters, AnyFunction } from "@ncac/marionext-types";
import { EventTrigger } from "./event-trigger.class";

/**
 * AnyClassEventHandlerFunction : any function that return void
 */
export type AnyClassEventHandlerFunction = (...args: any[]) => void;
export type MyClassEventHandlerFunction<
  F extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction
> = (...args: TParameters<F>) => ReturnType<F>;
export type RecordedClassEventHandlerFunction<
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
export interface DefaultEventMap {
  [K: string]: AnyClassEventHandlerFunction;
}
export type TEventMap<EventMap extends DefaultEventMap> = {
  [K in keyof EventMap]: MyClassEventHandlerFunction<EventMap[K]>;
} & {
  all: (eventName: string, ...args: any[]) => void;
};

export interface RecordedEvent<
  E extends AnyClassEventHandlerFunction = AnyClassEventHandlerFunction
> {
  callback: RecordedClassEventHandlerFunction<E>;
  context: any;
  ctx: any;
  listening?: any;
  listener?: any;
}
export type ThisEvents<
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
export type ExtractMethodName<TriggerMethodString extends any> =
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
export type MyRequestFunction<F extends AnyFunction = AnyFunction> = (
  ...args: TParameters<F>
) => requestReturn<ReturnType<F>>;

export interface EventHandler<
  Handler extends AnyFunction = AnyFunction,
  Callback extends MyFunction = AnyFunction
> extends MyFunction<Handler> {
  _callback?: Callback;
}

export interface RequestHandler<
  Handler extends AnyFunction = AnyFunction,
  Callback extends MyFunction = AnyFunction
> extends MyRequestFunction<Handler> {
  _callback?: Callback;
}

export interface DefaultRequestMap {
  [key: string]: RequestHandler;
}

export type TRequestMap<EventMap extends DefaultRequestMap> = {
  [K in keyof EventMap]: MyRequestFunction<EventMap[K]>;
};

export interface RecordedRequest<E extends MyRequestFunction> {
  callback: RequestHandler<E>;
  context: any;
}

export type ThisRequests<RequestMap extends DefaultRequestMap> = {
  [K in keyof RequestMap]?: RecordedRequest<RequestMap[K]>;
};
/**
 * Listening : interface for internal `_rdListeners` & `_rdListeningTo` properties
 */
export type Listenings = {
  [key: string]: {
    obj: AnyEventTrigger;
    listenId: string;
    listenerId: string;
    listeningTo?: Listenings;
    count: number;
  };
};

export interface AnyEventTrigger<
  ObjEventMap extends TEventMap<DefaultEventMap> = TEventMap<DefaultEventMap>
> extends EventTrigger<AnyEventTrigger<ObjEventMap>, ObjEventMap> {
  [key: string]: any;
}
// export interface EventRadioMixinObj extends EventMixin<AnyEventTrigger, any> {
//   radioEvents:
// }

// export interface ExtendedEventManager extends EventManager<any> {
//   [key: string]: any;
// }

// declare global {
//   /**
//    * Obtain the parameters of a function type in a tuple
//    */
//   type AlwaysParameters<T extends (...args: any) => any> = T extends (
//     ...args: infer P
//   ) => any
//     ? P
//     : any[];
// }

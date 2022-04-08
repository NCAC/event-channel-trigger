import { FunctionPropertyNames } from "@ncac/marionext-types";
import { _ } from "@ncac/marionext-lodash";
import { EventTrigger } from "./event-trigger.class";
import { callEventHandler } from "./call-event-handler";

import {
  DefaultEventMap,
  DefaultRequestMap,
  TEventMap,
  TRequestMap,
  ThisRequests,
  RequestHandler,
  AnyEventTrigger
} from "./types";

import { radioEventsApi } from "./radio-events-api";

export type channelActions = ("reply" | "replyOnce" | "stopReplying") &
  FunctionPropertyNames<Channel>;

export class Channel<
  ChannelEventMap extends TEventMap<DefaultEventMap> = TEventMap<DefaultEventMap>,
  ChannelRequestMap extends TRequestMap<DefaultRequestMap> = TRequestMap<DefaultRequestMap>
> extends EventTrigger<
  Channel<ChannelEventMap, ChannelRequestMap>,
  ChannelEventMap
> {
  readonly TClassRequestsMap: ChannelRequestMap;
  constructor(channelName: string, shouldDebug: boolean = false) {
    super();
    this._channelName = channelName;
    this._debug = shouldDebug;
  }

  private _debug: boolean;

  private _channelName: string;
  get channelName() {
    return this._channelName;
  }

  private _rdRequests: ThisRequests<ChannelRequestMap>;

  request<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey
  ): ReturnType<ChannelRequestMap[RequestKey]> {
    // const channelName = this.channelName;
    const requests = this._rdRequests;
    if (requests[requestName]) {
      const handler = requests[requestName];
      return callEventHandler(handler.callback, handler.context, []);
    }
  }

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
  reply<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey | ChannelRequestMap,
    callback: ChannelRequestMap[RequestKey] | AnyEventTrigger,
    context?: AnyEventTrigger
  ) {
    if (
      radioEventsApi<ChannelEventMap, ChannelRequestMap, RequestKey, "reply">(
        this as Channel<ChannelEventMap, ChannelRequestMap>,
        "reply",
        // @ts-ignore
        requestName,
        [callback, context]
      )
    ) {
      return this;
    }
    if (!this._rdRequests) {
      this._rdRequests = {};
    }
    if (this._rdRequests[requestName as RequestKey]) {
      // debugLog
      if (console && console.warn && this._debug) {
        console.warn(
          `A request was overwritten on the ${this._channelName} : ${requestName}`
        );
      }
    }
    // @ts-ignore
    this._rdRequests[requestName] = {
      callback: _.makeCallback(callback),
      context: context || this
    };
    return this;
  }

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
  replyOnce<RequestKey extends keyof ChannelRequestMap>(
    requestName: RequestKey | ChannelRequestMap,
    callback: ChannelRequestMap[RequestKey] | AnyEventTrigger,
    context?: AnyEventTrigger
  ) {
    if (
      radioEventsApi<
        ChannelEventMap,
        ChannelRequestMap,
        RequestKey,
        "replyOnce"
      >(
        this,
        "replyOnce",
        // @ts-ignore
        requestName,
        [callback, context]
      )
    ) {
      return this;
    }

    var once = _.once(() => {
      // @ts-ignore
      this.stopReplying<RequestKey>(requestName);
      return _.makeCallback(callback as Function).apply(this, arguments);
    });
    return this.reply(
      requestName as RequestKey,
      once as ChannelRequestMap[RequestKey],
      context
    );
  }

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
  stopReplying<RequestKey extends keyof ChannelRequestMap>(
    requestName?: RequestKey | ChannelRequestMap,
    callback?: ChannelRequestMap[RequestKey] | AnyEventTrigger,
    context?: AnyEventTrigger
  ) {
    if (
      radioEventsApi<
        ChannelEventMap,
        ChannelRequestMap,
        RequestKey,
        "stopReplying"
      >(
        this,
        "stopReplying",
        // @ts-ignore
        requestName
      )
    ) {
      return this;
    }
    // Remove everything if there are no arguments passed
    if (!requestName && !callback && !context) {
      delete this._rdRequests;
    } else {
      this._removeHandlers<RequestKey>(
        this._rdRequests,
        // @ts-ignore
        requestName,
        callback as ChannelRequestMap[RequestKey],
        context
      );
    }
    return this;
  }

  // A helper used by `off` methods to the handler from the store
  private _removeHandler<RequestKey extends keyof ChannelRequestMap>(
    map: ThisRequests<ChannelRequestMap>,
    requestName: RequestKey,
    callback?: ChannelRequestMap[RequestKey],
    context?: AnyEventTrigger
  ) {
    var event = map[requestName];
    if (
      // @ts-ignore
      (!callback ||
        callback === event.callback ||
        callback === event.callback._callback) &&
      (!context || context === event.context)
    ) {
      delete map[requestName];
      return true;
    }
  }

  private _removeHandlers<RequestKey extends keyof ChannelRequestMap>(
    map: ThisRequests<ChannelRequestMap>,
    requestName?: RequestKey,
    callback?: ChannelRequestMap[RequestKey],
    context?: AnyEventTrigger
  ): void;
  private _removeHandlers<RequestKey extends keyof ChannelRequestMap>(
    map: ThisRequests<ChannelRequestMap>,
    requetstName?: ChannelRequestMap
  ): void;
  private _removeHandlers<RequestKey extends keyof ChannelRequestMap>(
    map: ThisRequests<ChannelRequestMap>,
    requestName?: RequestKey | ChannelRequestMap,
    callback?: ChannelRequestMap[RequestKey],
    context?: AnyEventTrigger
  ) {
    const requestNames = _.isString(requestName)
      ? [requestName as RequestKey]
      : (Object.keys(map) as RequestKey[]);
    let request: keyof ChannelRequestMap;
    let matched = false;
    for (let i = 0, length = requestNames.length; i < length; i++) {
      request = requestNames[i];
      // If there's no event by this name, continue
      // with the loop
      if (!map[request]) {
        continue;
      }
      if (
        this._removeHandler<RequestKey>(
          map,
          request as RequestKey,
          callback,
          context
        )
      ) {
        matched = true;
      }
    }
    return matched;
  }

  private reset(): this {
    this.off();
    this.stopListening();
    this.stopReplying();
    return this;
  }
}

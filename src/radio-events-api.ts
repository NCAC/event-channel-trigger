import { _ } from "@ncac/marionext-lodash";

import { eventSplitter } from "./variables";

import {
  TEventMap,
  DefaultEventMap,
  TRequestMap,
  DefaultRequestMap
} from "./types";
import { Channel, channelActions } from "./channel.class";

export function radioEventsApi<
  ChannelEventMap extends TEventMap<DefaultEventMap>,
  ChannelRequestMap extends TRequestMap<DefaultRequestMap>,
  ChannelRequestKey extends keyof ChannelRequestMap,
  ActionName extends channelActions
>(
  channel: Channel<ChannelEventMap, ChannelRequestMap>,
  action: ActionName,
  requestName: ChannelRequestKey,
  rest?: any[]
): false;
export function radioEventsApi<
  ChannelEventMap extends TEventMap<DefaultEventMap>,
  ChannelRequestMap extends TRequestMap<DefaultRequestMap>,
  ChannelRequestKey extends keyof ChannelRequestMap,
  ActionName extends channelActions
>(
  channel: Channel<ChannelEventMap, ChannelRequestMap>,
  action: ActionName,
  requestName: ChannelRequestMap,
  rest?: any[]
): {
  [key in keyof ChannelRequestMap]: Channel<
    ChannelEventMap,
    ChannelRequestMap
  >[ActionName];
};
export function radioEventsApi<
  ChannelEventMap extends TEventMap<DefaultEventMap>,
  ChannelRequestMap extends TRequestMap<DefaultRequestMap>,
  RequestKey extends keyof ChannelRequestMap,
  ActionName extends channelActions
>(
  channel: Channel<ChannelEventMap, ChannelRequestMap>,
  action: ActionName,
  requestName: ChannelRequestMap | RequestKey,
  rest?: any[]
):
  | false
  | {
      [key in keyof ChannelRequestMap]: Channel<
        ChannelEventMap,
        ChannelRequestMap
      >[ActionName];
    } {
  if (!requestName) {
    return false;
  }
  let results: {
    [key in keyof ChannelRequestMap]: Channel<
      ChannelEventMap,
      ChannelRequestMap
    >[ActionName];
  } = {} as any;
  if (_.isString(requestName)) {
    return false;
  } else {
    (Object.keys(requestName as ChannelRequestMap) as RequestKey[]).forEach(
      (request) => {
        var result = channel[action].apply(
          channel,
          [request, (requestName as ChannelRequestMap)[request]].concat(rest)
        );
        eventSplitter.test(request as string)
          ? Object.assign(results, result)
          : (results[request] = result);
      }
    );
    return results;
  }
}

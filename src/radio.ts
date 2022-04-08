import { _ } from "@ncac/marionext-lodash";
import { Channel, channelActions } from "./channel.class";
import { eventSplitter } from "./variables";
import {
  DefaultRequestMap,
  DefaultEventMap,
  TRequestMap,
  TEventMap
} from "./types";

function debugText(warning: string, eventName: string, channelName?: string) {
  return (
    warning +
    (channelName ? ` on the ${channelName} channel` : "") +
    `: "${eventName}"`
  );
}

export interface RadioMixinOptions {
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
class RadioConstructor {
  private static instance: RadioConstructor;

  public static getInstance(): RadioConstructor {
    if (!RadioConstructor.instance) {
      RadioConstructor.instance = new RadioConstructor();
    }
    return RadioConstructor.instance;
  }
  private constructor() {}

  protected _channels: { [key: string]: Channel } = {};

  /**
   * Radio.channel(channelName: string)
   * --------
   * @returns the Channel with channelName
   * if the Channel does not exist, creates a new one
   * else, returns the existing channel
   */
  public channel<
    EventMap extends TEventMap<DefaultEventMap>,
    RequestMap extends TRequestMap<DefaultRequestMap>
  >(channelName: string): Channel<EventMap, RequestMap> {
    if (this._channels[channelName]) {
      return this._channels[channelName] as Channel<EventMap, RequestMap>;
    } else {
      return (this._channels[channelName] = new Channel<EventMap, RequestMap>(
        channelName,
        this._shouldDebug
      ));
    }
  }

  private _shouldDebug: boolean = false;

  setDebug(shouldDebug = true) {
    this._shouldDebug = shouldDebug;
  }
}

export const Radio = RadioConstructor.getInstance();

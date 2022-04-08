import { FunctionPropertyNames } from "@ncac/marionext-types";
import { _ } from "@ncac/marionext-lodash";
import { AnyEventTrigger, MyClassEventHandlerFunction } from "./types";
import { Channel } from "./channel.class";

export type TargetObjectEventMap<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  EventMap extends TargetObject["TClassEventMap"],
  Methods extends FunctionPropertyNames<SourceObject> = FunctionPropertyNames<SourceObject>
> = Partial<{
  [Key in keyof EventMap]:
    | keyof Methods
    | MyClassEventHandlerFunction<EventMap[Key]>;
}>;

export type TargetObjectRequestsMap<
  SourceObject extends AnyEventTrigger,
  TargetChannel extends Channel,
  ChannelEventMap extends TargetChannel["TClassRequestsMap"],
  Methods extends FunctionPropertyNames<SourceObject> = FunctionPropertyNames<SourceObject>
> = Partial<{
  [Key in keyof ChannelEventMap]:
    | keyof Methods
    | MyClassEventHandlerFunction<ChannelEventMap[Key]>;
}>;

export function bindEvents<
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
) {
  if (!target || !targetEventMap) {
    return source;
  }
  source.listenTo(
    target,
    normalizeBindings(source, targetEventMap) as TargetEventMap
  );
  return source;
}

export function unbindEvents<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  TargetEventMap extends TargetObject["TClassEventMap"]
>(source: SourceObject, target: TargetObject, targetEventMap?: TargetEventMap) {
  if (!target) {
    return source;
  }
  if (!targetEventMap) {
    source.stopListening(target);
    return source;
  }
  source.stopListening(
    target,
    normalizeBindings(source, targetEventMap) as TargetEventMap
  );
  return source;
}

export function bindRequests<
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
): SourceObject {
  if (!targetChannel || !bindings) {
    return source;
  }
  targetChannel.reply(
    normalizeBindings(source, bindings) as TargetRequestsMap,
    source
  );
  return source;
}

export function unbindRequests<
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
): SourceObject {
  if (!targetChannel) {
    return source;
  }
  if (!bindings) {
    targetChannel.stopReplying(null, null, source);
    return source;
  }
  targetChannel.stopReplying(
    normalizeBindings(source, bindings) as TargetRequestsMap
  );
}

export function normalizeBindings<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger,
  TargetEventMap extends TargetObject["TClassEventMap"]
>(
  source: SourceObject,
  hash: TargetObjectEventMap<SourceObject, TargetObject, TargetEventMap>
): TargetObjectEventMap<SourceObject, TargetObject, TargetEventMap>;
export function normalizeBindings<
  SourceObject extends AnyEventTrigger,
  TargetObject extends Channel,
  TargetRequestMap extends TargetObject["TClassRequestsMap"]
>(
  source: SourceObject,
  hash: TargetObjectRequestsMap<SourceObject, TargetObject, TargetRequestMap>
): TargetObjectRequestsMap<SourceObject, TargetObject, TargetRequestMap>;

export function normalizeBindings<
  SourceObject extends AnyEventTrigger,
  TargetObject extends AnyEventTrigger | Channel,
  TargetEventMap extends
    | TargetObject["TClassEventMap"]
    | TargetObject["TClassRequestsMap"]
>(
  source: SourceObject,
  hash: TargetObjectEventMap<SourceObject, TargetObject, TargetEventMap>
): TargetObject extends AnyEventTrigger
  ? TargetObject["TClassEventMap"]
  : TargetObject["TClassRequestsMap"] {
  return _.reduce(
    hash,
    (normalizedHash, method, name) => {
      if (!_.isFunction(method)) {
        method = source[method as string];
      }
      if (method) {
        normalizedHash[name] = method;
      }
      return normalizedHash;
    },
    {}
  ) as TargetObject extends AnyEventTrigger
    ? TargetObject["TClassEventMap"]
    : TargetObject["TClassRequestsMap"];
}

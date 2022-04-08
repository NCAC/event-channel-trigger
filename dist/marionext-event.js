import { _ } from "@ncac/marionext-lodash";

function buildEventArgs(name, callback, context, listener) {
  if (name && typeof name === "object") {
    const EventKeys = Object.keys(name);
    const result = EventKeys.reduce((eventArgs, key) => {
      return eventArgs.concat(
        buildEventArgs(key, name[key], context || callback, listener)
      );
    }, []);
    return result;
  }
  return [{ name: name, callback, context, listener }];
}

const onApi = function (params) {
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
const onReducer = function (events, eventArgObj) {
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
  return onApi(onApiArgs);
};

const cleanupListener = function (cleanUpListenerParams) {
  const listeningTo = cleanUpListenerParams.listeningTo;
  const listenId = cleanUpListenerParams.listenId;
  const listenerId = cleanUpListenerParams.listenerId;
  const ListenedObj = cleanUpListenerParams.obj;
  delete listeningTo[listenId];
  delete ListenedObj._rdListeners[listenerId];
};
// The reducing API that removes a callback from the `events` object.
const offReducer = function (events, eventArgObj) {
  const eventNames = eventArgObj.name
    ? [eventArgObj.name]
    : Object.keys(events);
  const callback = eventArgObj.callback;
  const context = eventArgObj.context;
  eventNames.forEach((eventKey) => {
    const handlers = events[eventKey];
    // Bail out if there are no events stored.
    if (!handlers) {
      return;
    }
    events[eventKey] = handlers.reduce((remaininig, handler) => {
      if (
        (callback &&
          callback !== handler.callback &&
          callback !== handler.callback._callback) ||
        (context && context !== handler.context)
      ) {
        remaininig.push(handler);
        return remaininig;
      }
      // If not including event, clean up any related listener
      if (handler.listener) {
        const listener = handler.listener;
        listener.count--;
        if (!listener.count) {
          cleanupListener(listener);
        }
      }
      return remaininig;
    }, []);
    if (!events[eventKey].length) {
      delete events[eventKey];
    }
  });
  return events;
};

const getListener = function (obj, listenerObj) {
  const listenId = obj._listenId || (obj._listenId = _.uniqueId("l"));
  obj._rdEvents = obj._rdEvents || {};
  const listeningTo =
    listenerObj._rdListeningTo || (listenerObj._rdListeningTo = {});
  const listener = listeningTo[listenId];
  // This listenerObj is not listening to any other events on `obj` yet.
  // Setup the necessary references to track the listening callbacks.
  if (!listener) {
    const listenerId =
      listenerObj._listenId || (listenerObj._listenId = _.uniqueId("l"));
    listeningTo[listenId] = {
      obj,
      listenId,
      listenerId,
      listeningTo,
      count: 0
    };
    return listeningTo[listenId];
  }
  return listener;
};
const listenToApi = function (listenToApiParams) {
  const callback = listenToApiParams.callback;
  const listener = listenToApiParams.listener;
  const eventName = listenToApiParams.name;
  if (!listenToApiParams.callback) {
    return;
  }
  const { obj, listenerId } = listenToApiParams.listener;
  const listeners = obj._rdListeners || (obj._rdListeners = {});
  const context = listenToApiParams.context;
  obj._rdEvents = onApi({
    events: obj._rdEvents,
    name: eventName,
    callback,
    context,
    listener
  });
  listeners[listenerId] = listener;
  listener.count++;
  // Call `on` for interop
  obj.on(eventName, callback, context, { _rdInternal: true });
};

const onceReducer = function (events, eventArgObj) {
  const callback = eventArgObj.callback;
  const eventName = eventArgObj.name;
  const context = eventArgObj.context;
  if (!callback) {
    return events;
  }
  const onceCallback = onceWrap(callback, this.off.bind(this, eventName));
  return onApi({
    events,
    name: eventName,
    callback: onceCallback,
    context,
    ctx: this
  });
};
function onceWrap(callback, offCallback) {
  const onceCallback = _.once(function () {
    offCallback(onceCallback);
    return callback.apply(this, arguments);
  });
  onceCallback._callback = callback;
  return onceCallback;
}

const listenToOnceApi = function listenToOnceApi(listenToOnceApiParams) {
  const callback = listenToOnceApiParams.callback;
  const listener = listenToOnceApiParams.listener;
  const eventName = listenToOnceApiParams.name;
  if (!callback) {
    return;
  }
  const offCallback = this.stopListening.bind(this, listener.obj, eventName);
  const onceCallback = onceWrap(callback, offCallback);
  listenToApi({
    name: eventName,
    callback: onceCallback,
    context: listenToOnceApiParams.context,
    listener
  });
};

// An optimized way to execute callbacks.
const callEventHandler = function callEventHandler(
  callback,
  context,
  args = []
) {
  switch (args.length) {
    case 0:
      return callback.call(context);
    case 1:
      return callback.call(context, args[0]);
    case 2:
      return callback.call(context, args[0], args[1]);
    case 3:
      return callback.call(context, args[0], args[1], args[2]);
    default:
      return callback.apply(context, args);
  }
};

const triggerApi = function triggerApi(triggerApiParams) {
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
    triggerEvents(allEvents, [eventName].concat(args));
  }
};
const triggerEvents = function triggerEvents(events, args) {
  events.forEach((event) => {
    callEventHandler(event.callback, event.ctx, args);
  });
};

const EventTriggerProps = [
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
const methodCache = {};
const triggerMethodSplitter = /(^|:)(\w)/gi;
// take the event section ("section1:section2:section3")
// and turn it in to uppercase name onSection1Section2Section3
function getEventName(match, prefix, eventName) {
  return eventName.toUpperCase();
}
const getOnMethodName = function getOnMethodName(event) {
  if (!methodCache[event]) {
    methodCache[event] =
      "on" + event.replace(triggerMethodSplitter, getEventName);
  }
  return methodCache[event];
};
class EventTrigger {
  on(events, callback, context, opts) {
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
  off(eventName, callback, context, opts) {
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
  once(eventName, callback, context) {
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
  listenTo(obj, eventName, callback) {
    if (!obj) {
      return this;
    }
    const listener = getListener(obj, this);
    const eventArgs = buildEventArgs(eventName, callback, this, listener);
    eventArgs.forEach((eventArg) => {
      listenToApi(eventArg);
    });
  }
  /**
   * listenToOnce()
   * ------
   * Inversion-of-control versions of `once`.
   */
  listenToOnce(obj, eventName, callback) {
    if (!obj) {
      return this;
    }
    const listener = getListener(obj, this);
    const eventArgs = buildEventArgs(eventName, callback, this, listener);
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
  stopListening(obj, eventName, callback) {
    const listeningTo = this._rdListeningTo;
    if (!listeningTo) {
      return this;
    }
    const eventArgs = buildEventArgs(eventName, callback, this);
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
        const events = listenToObj._rdEvents;
        if (!events) {
          return;
        }
        listenToObj._rdEvents = offReducer(events, eventArg);
      });
    }
    return this;
  }
  trigger(eventName, ...args) {
    if (!this._rdEvents) {
      return this;
    }
    triggerApi({
      events: this._rdEvents,
      name: eventName,
      args
    });
    return this;
  }
  /**
   * triggerMethod
   * -------
   */
  triggerMethod(
    eventName,
    ...args // FIX triggerMethod(this, options) :( ???
  ) {
    const methodName = getOnMethodName(eventName);
    const method = this[methodName];
    // call the onMethodName if it exists
    if (_.isFunction(method)) {
      // pass all args, except the event name
      method.apply(this, args);
    }
    // trigger the event
    this.trigger.apply(this, arguments);
  }
}

const eventSplitter = /\s+/;

function radioEventsApi(channel, action, requestName, rest) {
  if (!requestName) {
    return false;
  }
  let results = {};
  if (_.isString(requestName)) {
    return false;
  } else {
    Object.keys(requestName).forEach((request) => {
      var result = channel[action].apply(
        channel,
        [request, requestName[request]].concat(rest)
      );
      eventSplitter.test(request)
        ? Object.assign(results, result)
        : (results[request] = result);
    });
    return results;
  }
}

class Channel extends EventTrigger {
  constructor(channelName, shouldDebug = false) {
    super();
    this._channelName = channelName;
    this._debug = shouldDebug;
  }
  get channelName() {
    return this._channelName;
  }
  request(requestName) {
    // const channelName = this.channelName;
    const requests = this._rdRequests;
    if (requests[requestName]) {
      const handler = requests[requestName];
      return callEventHandler(handler.callback, handler.context, []);
    }
  }
  reply(requestName, callback, context) {
    if (
      radioEventsApi(
        this,
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
    if (this._rdRequests[requestName]) {
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
  replyOnce(requestName, callback, context) {
    if (
      radioEventsApi(
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
      this.stopReplying(requestName);
      return _.makeCallback(callback).apply(this, arguments);
    });
    return this.reply(requestName, once, context);
  }
  stopReplying(requestName, callback, context) {
    if (
      radioEventsApi(
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
      this._removeHandlers(
        this._rdRequests,
        // @ts-ignore
        requestName,
        callback,
        context
      );
    }
    return this;
  }
  // A helper used by `off` methods to the handler from the store
  _removeHandler(map, requestName, callback, context) {
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
  _removeHandlers(map, requestName, callback, context) {
    const requestNames = _.isString(requestName)
      ? [requestName]
      : Object.keys(map);
    let request;
    let matched = false;
    for (let i = 0, length = requestNames.length; i < length; i++) {
      request = requestNames[i];
      // If there's no event by this name, continue
      // with the loop
      if (!map[request]) {
        continue;
      }
      if (this._removeHandler(map, request, callback, context)) {
        matched = true;
      }
    }
    return matched;
  }
  reset() {
    this.off();
    this.stopListening();
    this.stopReplying();
    return this;
  }
}

/**
 * _Radio is a singleton
 */
class RadioConstructor {
  constructor() {
    this._channels = {};
    this._shouldDebug = false;
  }
  static getInstance() {
    if (!RadioConstructor.instance) {
      RadioConstructor.instance = new RadioConstructor();
    }
    return RadioConstructor.instance;
  }
  /**
   * Radio.channel(channelName: string)
   * --------
   * @returns the Channel with channelName
   * if the Channel does not exist, creates a new one
   * else, returns the existing channel
   */
  channel(channelName) {
    if (this._channels[channelName]) {
      return this._channels[channelName];
    } else {
      return (this._channels[channelName] = new Channel(
        channelName,
        this._shouldDebug
      ));
    }
  }
  setDebug(shouldDebug = true) {
    this._shouldDebug = shouldDebug;
  }
}
const Radio = RadioConstructor.getInstance();

function bindEvents(source, target, targetEventMap) {
  if (!target || !targetEventMap) {
    return source;
  }
  source.listenTo(target, normalizeBindings(source, targetEventMap));
  return source;
}
function unbindEvents(source, target, targetEventMap) {
  if (!target) {
    return source;
  }
  if (!targetEventMap) {
    source.stopListening(target);
    return source;
  }
  source.stopListening(target, normalizeBindings(source, targetEventMap));
  return source;
}
function bindRequests(source, targetChannel, bindings) {
  if (!targetChannel || !bindings) {
    return source;
  }
  targetChannel.reply(normalizeBindings(source, bindings), source);
  return source;
}
function unbindRequests(source, targetChannel, bindings) {
  if (!targetChannel) {
    return source;
  }
  if (!bindings) {
    targetChannel.stopReplying(null, null, source);
    return source;
  }
  targetChannel.stopReplying(normalizeBindings(source, bindings));
}
function normalizeBindings(source, hash) {
  return _.reduce(
    hash,
    (normalizedHash, method, name) => {
      if (!_.isFunction(method)) {
        method = source[method];
      }
      if (method) {
        normalizedHash[name] = method;
      }
      return normalizedHash;
    },
    {}
  );
}

export {
  Channel,
  EventTrigger,
  EventTriggerProps,
  Radio,
  bindEvents,
  bindRequests,
  normalizeBindings,
  unbindEvents,
  unbindRequests
};

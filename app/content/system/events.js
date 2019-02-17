'use strict';

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

export class EventEmitter {
    constructor() {
        this._events = {};
        this._eventsEnabled = true;
    }

    disableEvents() {
        this._eventsEnabled = false;
    }

    enableEvents() {
        this._eventsEnabled = true;
    }

    // Bind an event to a `callback` function.
    on(name, callback, context) {
        eventsApi(onApi, this._events, name, callback, context, this);
        return this;
    }

    // Remove one or many callbacks.
    // If `context` is null, removes all callbacks with that function.
    // If `callback` is null, removes all callbacks for the event.
    // If `name` is null, removes all bound callbacks for all events.
    off(name, callback, context) {
        eventsApi(offApi, this._events, name, callback, context);
        return this;
    }

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once() {
        // Map the event into a `{event: once}` object.
        var events = onceMap(name, callback, this.off.bind(this));
        return this.on(events, void 0, context);
    }

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is
    trigger(name, ...args) {
        if (!this._eventsEnabled) return;
        // Pass `triggerSentinel` as "callback" param. If `name` is an object,
        // it `triggerApi` will be passed the property's value instead.
        eventsApi(triggerApi, this._events, name, triggerSentinel, args);
        return this;
    }

}

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it as been called.
var onceMap = function (name, callback, offer) {
    return eventsApi(function (map, name, callback, offer) {
        if (callback) {
            var once = map[name] = _.once(function () {
                offer(name, once);
                callback.apply(this, arguments);
            });
            once._callback = callback;
        }
        return map;
    }, {}, name, callback, offer);
};


// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`), reducing them by manipulating `events`.
// Passes a normalized (single event name and callback), as well as the `context`
// and `ctx` arguments to `iteratee`.
var eventsApi = function (iteratee, memo, name, callback, context, ctx) {
    var i = 0, names, length;
    if (name && typeof name === 'object') {
        // Handle event maps.
        for (names = Object.keys(name), length = names.length; i < length; i++) {
            memo = iteratee(memo, names[i], name[names[i]], context, ctx);
        }
    } else if (name && eventSplitter.test(name)) {
        // Handle space separated event names.
        for (names = name.split(eventSplitter), length = names.length; i < length; i++) {
            memo = iteratee(memo, names[i], callback, context, ctx);
        }
    } else {
        memo = iteratee(memo, name, callback, context, ctx);
    }
    return memo;
};

// The reducing API that adds a callback to the `events` object.
var onApi = function (events, name, callback, context, ctx) {
    if (callback) {
        var handlers = events[name] || (events[name] = []);
        handlers.push({callback: callback, context: context, ctx: context || ctx});
    }
    return events;
};

// The reducing API that removes a callback from the `events` object.
var offApi = function (events, name, callback, context) {
    // Remove all callbacks for all events.
    if (!events || !name && !context && !callback) return;

    var names = name ? [name] : Object.keys(events);
    for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];
        var handlers = events[name];

        // Bail out if there are no events stored.
        if (!handlers) break;

        // Find any remaining events.
        var remaining = [];
        if (callback || context) {
            for (var j = 0, k = handlers.length; j < k; j++) {
                var handler = handlers[j];
                if (
                    callback && callback !== handler.callback &&
                    callback !== handler.callback._callback ||
                    context && context !== handler.context
                ) {
                    remaining.push(handler);
                }
            }
        }

        events[name] = remaining;
    }
    return events;
};

// A known sentinel to detect triggering with a `{event: value}` object.
var triggerSentinel = {};

// Handles triggering the appropriate event callbacks.
var triggerApi = function (events, name, sentinel, args) {
    var handlers = events[name];
    if (handlers) triggerEvents(handlers, args);
    return events;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function (handlers, args) {
    var ev, i = -1, l = handlers.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
        case 0:
            while (++i < l) (ev = handlers[i]).callback.call(ev.ctx);
            return;
        case 1:
            while (++i < l) (ev = handlers[i]).callback.call(ev.ctx, a1);
            return;
        case 2:
            while (++i < l) (ev = handlers[i]).callback.call(ev.ctx, a1, a2);
            return;
        case 3:
            while (++i < l) (ev = handlers[i]).callback.call(ev.ctx, a1, a2, a3);
            return;
        default:
            while (++i < l) (ev = handlers[i]).callback.apply(ev.ctx, args);
            return;
    }
};

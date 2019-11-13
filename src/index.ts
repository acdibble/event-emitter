import Listener from './Listener';

interface Events {
  [eventName: string]: (Function | Listener)[];
}

class EventEmitter {
  static defaultMaxListeners = 10;

  private _maxListeners: number | undefined;

  private _eventsCount: number;

  private _events: Events;

  constructor() {
    this._events = {};
    this._eventsCount = 0;
  }

  emit(eventName: any, ...values: any[]): boolean {
    const listeners = this._events[eventName] ?? [];

    if (!listeners.length) return false;

    for (let i = 0; i < listeners.length; i += 1) {
      const listener = listeners[i];

      if (listener instanceof Listener) {
        this._removeListener(i, eventName, listeners);
        i -= 1;
      }

      // @ts-ignore
      listener.call(this, ...values);
    }

    return true;
  }

  private _on(
    eventName: any,
    listener: Function,
    prepend: boolean,
    once: boolean,
  ): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    this.emit('newListener', eventName, listener);

    const newListener = once ? new Listener(listener) : listener;
    const listeners = this._events[eventName];
    if (listeners) {
      const maxListeners = this._maxListeners ?? EventEmitter.defaultMaxListeners;
      if (maxListeners !== 0 && maxListeners !== Infinity && this._eventsCount + 1 > maxListeners) {
        console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${this._eventsCount} ${eventName} listeners added. Use emitter.setMaxListeners() to increase limit`);
      }
      listeners![prepend === true ? 'unshift' : 'push'](newListener);
    } else {
      this._events[eventName] = [newListener];
    }

    this._eventsCount += 1;
    return this;
  }

  on(eventName: any, listener: Function): EventEmitter {
    return this._on(eventName, listener, false, false);
  }

  private _removeListener(
    index: number,
    eventName: any,
    listeners: (Function | Listener)[],
  ): Function | Listener {
    this._eventsCount -= 1;
    const [listener] = listeners.splice(index, 1);
    this.emit('removeListener', eventName, listener);
    return listener;
  }

  removeListener(eventName: any, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    const listeners = this._events[eventName];
    if (!listeners?.length) return this;

    let index = -1;
    for (let i = 0; i < listeners.length; i += 1) {
      if (listeners[i] === listener || (listeners[i] as Listener).listener === listener) {
        index = i;
        break;
      }
    }

    if (index === -1) return this;

    this._removeListener(index, eventName, listeners);
    return this;
  }

  removeAllListeners(eventName?: any): EventEmitter {
    if (eventName !== undefined) {
      delete this._events[eventName];
    } else {
      // eslint-disable-next-line no-restricted-syntax
      this._events = {};
    }

    return this;
  }

  getMaxListeners(): number {
    return this._maxListeners ?? EventEmitter.defaultMaxListeners;
  }

  setMaxListeners(n: number): EventEmitter {
    if (typeof n !== 'number' || Number.isNaN(n)) {
      throw new RangeError(`The value of "n" is out of range. It must be a non-negative number. Received ${n}`);
    }

    this._maxListeners = n;

    return this;
  }

  listenerCount(eventName: any): number {
    return this._events[eventName]?.length ?? 0;
  }

  listeners(eventName: any): Function[] {
    return (this._events[eventName] ?? [])
      .map((listener) => (listener as Listener).listener ?? listener);
  }

  eventNames(): any[] {
    return Object.keys(this._events);
  }

  once(eventName: any, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    return this._on(eventName, listener, false, true);
  }

  prependOnceListener(eventName: any, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    return this._on(eventName, listener, true, true);
  }

  prependListener(eventName: any, listener: Function): EventEmitter {
    return this._on(eventName, listener, true, false);
  }

  rawListeners(eventName: any): (Function | Listener)[] {
    return [...this._events[eventName] ?? []];
  }
}

interface EventEmitter {
  off: typeof EventEmitter.prototype.removeListener;
  addListener: typeof EventEmitter.prototype.on;
}

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

export default EventEmitter;

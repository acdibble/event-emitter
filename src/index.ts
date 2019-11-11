interface Listener extends Function {
  listener: Function;
  _events: (Function | Listener)[];
}

class Listener extends Function {
  constructor(fn: Function) {
    super();
    this.listener = fn;
  }

  call(ctx: any, ...args: any[]) {
    return this.listener.call(ctx, ...args);
  }

  toString() {
    return this.listener.toString();
  }
}

interface EventEmitter {
  off: typeof EventEmitter.prototype.removeListener;
  addListener: typeof EventEmitter.prototype.on;
}

class EventEmitter {
  static defaultMaxListeners = 10;

  private _maxListeners: number | undefined;

  private _events: Map<string | Symbol, { listeners: (Function | Listener)[], maxListeners?: number }>

  constructor() {
    this._events = new Map();
  }

  emit(eventName: string | Symbol, ...values: any[]): boolean {
    const events = this._events.get(eventName)?.listeners || [];

    if (!events.length) return false;

    for (let i = 0; i < events.length; i += 1) {
      const event = events[i];

      if (event instanceof Listener) {
        events.splice(i, 1);
        i -= 1;
      }

      const ctx = /^function/.test(event.toString())
        ? this
        : globalThis;

      event.call(ctx, ...values);
    }

    return true;
  }

  private _on(eventName: string | Symbol, listener: Function | Listener, prepend: boolean): EventEmitter {
    if (!(listener instanceof Function || listener instanceof Listener)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    this.emit('newListener', event, listener.listener || listener);

    if (this._events.has(eventName)) {
      const event = this._events.get(eventName);
      const maxListeners = event?.maxListeners ?? EventEmitter.defaultMaxListeners;
      const totalListeners = event!.listeners.length;
      if (maxListeners !== 0 && maxListeners !== Infinity && totalListeners > maxListeners) {
        console.info(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${totalListeners} test listeners added. Use emitter.setMaxListeners() to increase limit`);
      }
      event!.listeners[prepend === true ? 'unshift' : 'push'](listener);
    } else {
      this._events.set(eventName, { listeners: [listener] });
    }

    return this;
  }

  on(eventName: string | Symbol, listener: Function): EventEmitter {
    return this._on(eventName, listener, false);
  }

  removeListener(eventName: string | Symbol, listener: Function): EventEmitter {
    const listeners = this._events.get(eventName)?.listeners;
    if (!listeners || !listeners.length) return this;

    const index = listeners.lastIndexOf(listener);
    if (index === -1) return this;

    listeners.splice(index, 1);
    this.emit('removeListener', event, listener);
    return this;
  }

  removeAllListeners(eventName?: string | Symbol): EventEmitter {
    if (eventName) {
      if (!['string', 'symbol'].includes(typeof eventName)) {
        throw new TypeError(`The "eventName" argument must be of type String or Symbol. Received type ${typeof eventName}`);
      }
      const event = this._events.get(eventName);
      if (event && event.listeners) {
        event.listeners = [];
      }
    } else {
      const allEvents = this._events.values();
      let event = allEvents.next();
      while (!event.done) {
        event.value.listeners = [];
        event = allEvents.next();
      }
    }

    return this;
  }

  getMaxListeners(): number {
    return this._maxListeners ?? EventEmitter.defaultMaxListeners;
  }

  setMaxListeners(n: number): EventEmitter {
    const newMax = Number(n);

    if (newMax < 0 || Number.isNaN(newMax)) {
      throw new RangeError(`The value of "n" is out of range. It must be a non-negative number. Received ${n}`);
    }

    this._maxListeners = newMax;

    return this;
  }

  listenerCount(eventName: string | Symbol): number {
    return this._events.get(eventName)?.listeners.length ?? 0;
  }

  listeners(eventName: string | Symbol): Function[] {
    if (!eventName || !['string', 'symbol'].includes(typeof eventName)) return [];

    return (this._events.get(eventName)?.listeners ?? [])
      .map((listener) => (listener as Listener).listener ?? listener);
  }

  eventNames(): (string | Symbol)[] {
    return [...this._events.keys()];
  }

  once(eventName: string | Symbol, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    return this._on(eventName, new Listener(listener), false);
  }

  prependOnceListener(eventName: string | Symbol, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    return this._on(eventName, new Listener(listener), true);
  }

  prependListener(eventName: string | Symbol, listener: Function): EventEmitter {
    return this._on(eventName, new Listener(listener), true);
  }

  rawListeners(eventName: string | Symbol): (Function | Listener)[] {
    return [...this._events.get(eventName)?.listeners ?? []];
  }
}

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

export default EventEmitter;

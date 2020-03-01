import Listener from './Listener';

interface Events {
  [eventName: string]: (Function | Listener)[];
}

export class EventEmitter {
  static defaultMaxListeners = 10;

  private eventsCount: number = 0;

  private maxListeners: number | undefined;

  private events: Events = {};

  emit(eventName: any, ...values: any[]): boolean {
    const listeners = this.events[eventName] ?? [];

    if (!listeners.length) return false;

    for (let i = 0; i < listeners.length; i += 1) {
      const listener = listeners[i];

      if (listener instanceof Listener) {
        this._removeListener(i, eventName, listeners);
        i -= 1;
      }

      // @ts-ignore
      listener.apply(this, values);
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
    const listeners = this.events[eventName] ?? [];
    const max = this.maxListeners ?? EventEmitter.defaultMaxListeners;
    if (max !== 0 && max !== Infinity && this.eventsCount + 1 > max) {
      console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${this.eventsCount} ${eventName} listeners added. Use emitter.setMaxListeners() to increase limit`);
    }
    listeners[prepend === true ? 'unshift' : 'push'](newListener);
    this.events[eventName] = listeners;

    this.eventsCount += 1;
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
    this.eventsCount -= 1;
    const [listener] = listeners.splice(index, 1);
    this.emit('removeListener', eventName, listener);
    return listener;
  }

  removeListener(eventName: any, listener: Function): EventEmitter {
    if (!(listener instanceof Function)) {
      throw new TypeError(`The "listener" argument must be of type Function. Received type ${typeof listener}`);
    }

    const listeners = this.events[eventName];
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
      delete this.events[eventName];
    } else {
      // eslint-disable-next-line no-restricted-syntax
      this.events = {};
    }

    return this;
  }

  getMaxListeners(): number {
    return this.maxListeners ?? EventEmitter.defaultMaxListeners;
  }

  setMaxListeners(n: number): EventEmitter {
    if (typeof n !== 'number' || Number.isNaN(n)) {
      throw new RangeError(`The value of "n" is out of range. It must be a non-negative number. Received ${n}`);
    }

    this.maxListeners = n;

    return this;
  }

  listenerCount(eventName: any): number {
    return this.events[eventName]?.length ?? 0;
  }

  listeners(eventName: any): Function[] {
    return (this.events[eventName] ?? [])
      .map((listener) => (listener as Listener).listener ?? listener);
  }

  eventNames(): any[] {
    return Object.keys(this.events);
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
    return [...this.events[eventName] ?? []];
  }
}

export interface EventEmitter {
  off: typeof EventEmitter.prototype.removeListener;
  addListener: typeof EventEmitter.prototype.on;
}

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

export const once = (
  emitter: EventEmitter,
  name: any,
): Promise<any[]> => new Promise((resolve, reject) => {
  emitter.once(name, (...args: any[]) => {
    emitter.off('error', reject);
    resolve(args);
  });
  emitter.on('error', reject);
});

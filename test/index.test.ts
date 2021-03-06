import { expect } from 'chai';
import { EventEmitter, once } from '../src/index';
import Listener from '../src/Listener';

const noop = () => { };

describe('EventEmitter', () => {
  describe('constructor', () => {
    it('is a constructor', () => {
      expect(new EventEmitter()).to.be.instanceOf(EventEmitter);
    });
  });

  describe('EventEmitter#on', () => {
    it('returns the instance of the event emitter', () => {
      const emitter = new EventEmitter();
      const out = emitter.on('test', noop);
      expect(out).to.equal(emitter);
    });

    it('expects a function as the second argument', () => {
      const emitter = new EventEmitter();
      try {
        emitter.on('test');
      } catch (e) {
        expect(e.message).to.equal('The "listener" argument must be of type Function. Received type undefined');
      }
    });

    it('adds events to internal register', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);

      const events = emitter.events.test;
      expect(events).to.eql([noop]);
    });

    it('adds events to the same internal register', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('test', noop);

      const events = emitter.events.test;
      expect(events).to.eql([noop, noop]);
    });

    it('adds events to the same and different internal registers', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('test', noop);
      emitter.on('test2', noop);

      const events1 = emitter.events.test;
      expect(events1).to.eql([noop, noop]);

      const events2 = emitter.events.test2;
      expect(events2).to.eql([noop]);
    });

    it('emits a "newListener" event with eventName and listener function', () => {
      const emitter = new EventEmitter();
      const calls = [];
      emitter.on('newListener', (...args) => calls.push(args));
      emitter.on('test', noop);
      expect(calls.length).to.eql(1);
      expect(calls[0][0]).to.eql('test');
      expect(calls[0][1]).to.eql(noop);
    });

    it('emits "newListener" before adding the event', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      let i = 0;
      let call1 = null;
      emitter.on('newListener', () => { call1 = i++; });
      const events = emitter.events.test;
      const oldPush = events.push;
      let call2 = null;
      events.push = (...args) => {
        call2 = i++;
        return oldPush.call(events, ...args);
      };
      emitter.on('test', noop);

      expect(call1).to.eql(0);
      expect(call2).to.eql(1);
    });

    it('warns with a MaxListenersExceededWarning when too many listeners are added', () => {
      const emitter = new EventEmitter();
      emitter.setMaxListeners(1);
      const { warn } = console;
      const warnings = [];
      console.warn = (...args) => {
        warnings.push(...args);
        warn.call(console, ...args);
      };
      emitter.on('test', noop);
      emitter.on('test', noop);
      console.warn = warn;
      expect(warnings).to.have.lengthOf(1);
      expect(warnings[0]).to.eql('MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 1 test listeners added. Use emitter.setMaxListeners() to increase limit');
    });
  });

  describe('EventEmitter#addEventListener', () => {
    it('is an alias of on', () => {
      expect(EventEmitter.prototype.addListener).to.eql(EventEmitter.prototype.on);
    });
  });

  describe('EventEmitter#emit', () => {
    it('emits events to registered events under the given name', () => {
      let called1 = false;
      const fn1 = () => { called1 = true; };
      let called2 = false;
      const fn2 = () => { called2 = true; };
      let called3 = false;
      const fn3 = () => { called3 = true; };

      const emitter = new EventEmitter();
      emitter.on('test', fn1);
      emitter.on('test', fn2);
      emitter.on('test2', fn3);
      emitter.emit('test');
      expect(called1).to.eql(true);
      expect(called2).to.eql(true);
      expect(called3).to.eql(false);
    });

    it('returns false if no events are registered under the given name', () => {
      const emitter = new EventEmitter();
      const called = emitter.emit('test');
      expect(called).to.eql(false);
    });

    it('returns true if at least one event is registered under the given name', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      const called = emitter.emit('test');
      expect(called).to.eql(true);
    });

    it('passes event emitter as this to functions', () => {
      const emitter = new EventEmitter();
      let that = null;
      emitter.on('test', function () { that = this; });
      emitter.emit('test');
      expect(that).to.eql(emitter);
    });
  });

  describe('EventEmitter#removeListener', () => {
    it('returns the event emitter instance', () => {
      const emitter = new EventEmitter();
      const out = emitter.removeListener('test', noop);
      expect(out).to.eql(emitter);
    });

    it('properly removes a listener', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.removeListener('test', noop);

      const events = emitter.events.test;
      expect(events).to.eql([]);
    });

    it('emits "removeListener"', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      const calls = [];
      emitter.on('removeListener', (...args) => calls.push(args));
      emitter.removeListener('test', noop);
      expect(calls.length).to.eql(1);
      expect(calls[0]).to.eql(['test', noop]);
    });

    it('throws an error if listener is not a function', () => {
      const emitter = new EventEmitter();
      try {
        emitter.removeListener('test');
      } catch (e) {
        expect(e.message).to.equal('The "listener" argument must be of type Function. Received type undefined');
      }
    });

    it('still returns instance even if listener is not found', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      expect(emitter.events.test).to.have.lengthOf(1);
      const out = emitter.removeListener('test', () => { });
      expect(out).to.eql(emitter);
      expect(emitter.events.test).to.have.lengthOf(1);
    });

    it('still returns instance even if listener is not found', () => {
      const emitter = new EventEmitter();
      emitter.once('test', noop);
      expect(emitter.events.test).to.have.lengthOf(1);
      const out = emitter.removeListener('test', () => { });
      expect(out).to.eql(emitter);
      expect(emitter.events.test).to.have.lengthOf(1);
    });

    it('removes a once listener', () => {
      const emitter = new EventEmitter();
      emitter.once('test', noop);
      expect(emitter.events.test).to.have.lengthOf(1);
      const out = emitter.removeListener('test', noop);
      expect(out).to.eql(emitter);
      expect(emitter.events.test).to.have.lengthOf(0);
    });

    it('only removes first found instance', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.on('test', () => { });
      emitter.once('test', noop);

      expect(emitter.events.test).to.have.lengthOf(3);
      const out = emitter.removeListener('test', noop);
      expect(out).to.eql(emitter);
      expect(emitter.events.test).to.have.lengthOf(2);
    });
  });

  describe('EventEmitter#off', () => {
    it('is an alias of removeListener', () => {
      expect(EventEmitter.prototype.off).to.eql(EventEmitter.prototype.removeListener);
    });
  });

  describe('EventEmitter#once', () => {
    it('properly invokes once listeners', () => {
      let called1 = false;
      let calledWith;
      const fn1 = (...args) => {
        called1 = true;
        calledWith = args;
      };

      const emitter = new EventEmitter();
      emitter.once('test', fn1);
      emitter.emit('test', 'a', 0x0b, Symbol.for('test'));
      expect(called1).to.eql(true);
      expect(calledWith).to.eql(['a', 0x0b, Symbol.for('test')]);
    });

    it('properly invokes once listeners and removes them', () => {
      let called1 = false;
      const fn1 = () => { called1 = true; };
      let called2 = false;
      const fn2 = () => { called2 = true; };

      const emitter = new EventEmitter();
      emitter.on('test', fn1);
      emitter.once('test', fn2);
      emitter.emit('test');
      expect(called1).to.eql(true);
      expect(called2).to.eql(true);

      expect(emitter.events.test).to.eql([fn1]);
    });

    it('properly invokes once listeners and removes them calling "removeListener"', () => {
      let i = 0;
      let call1 = null;
      const fn1 = () => { call1 = i++; };
      let call2 = null;
      const fn2 = () => { call2 = i++; };
      let call3 = null;
      const fn3 = () => { call3 = i++; };

      const emitter = new EventEmitter();
      emitter.on('test', fn1);
      emitter.once('test', fn2);
      emitter.on('removeListener', fn3);
      emitter.emit('test');
      expect(call1).to.eql(0);
      expect(call2).to.eql(2);
      expect(call3).to.eql(1);

      expect(emitter.events.test).to.eql([fn1]);
    });

    it('throws an error if listener is not a function', () => {
      const emitter = new EventEmitter();
      try {
        emitter.once('test');
      } catch (e) {
        expect(e.message).to.equal('The "listener" argument must be of type Function. Received type undefined');
      }
    });
  });

  describe('EventEmitter#removeAllListeners', () => {
    it('returns the event emitter instance', () => {
      const emitter = new EventEmitter();
      expect(emitter.removeAllListeners()).to.eql(emitter);
    });

    it('removes all listeners for all events', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('another', noop);
      emitter.on('aThird', noop);

      emitter.removeAllListeners();
      expect(Object.keys(emitter.events).length).to.eql(0);
    });

    it('removes all listeners for a certain event', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('another', noop);
      emitter.on('aThird', noop);

      emitter.removeAllListeners('test');
      expect(Object.keys(emitter.events).length).to.eql(2);

      expect(emitter.events.another).to.eql([noop]);
      expect(emitter.events.aThird).to.eql([noop]);
    });
  });

  describe('EventEmitter#setMaxListeners', () => {
    it('sets the max listeners to a non-negative number', () => {
      const emitter = new EventEmitter();
      emitter.setMaxListeners(15);
      expect(emitter.maxListeners).to.eql(15);
    });

    it('rejects non-numbers', () => {
      const emitter = new EventEmitter();
      try {
        emitter.setMaxListeners('15');
      } catch (e) {
        expect(e).to.be.instanceOf(RangeError);
        expect(e.message).to.eql('The value of "n" is out of range. It must be a non-negative number. Received 15');
      }
    });

    it('rejects negative numbers', () => {
      const emitter = new EventEmitter();
      try {
        emitter.setMaxListeners(-1);
      } catch (e) {
        expect(e).to.be.instanceOf(RangeError);
        expect(e.message).to.eql('The value of "n" is out of range. It must be a non-negative number. Received -1');
      }
    });
  });

  describe('EventEmitter.defaultMaxListeners', () => {
    beforeEach(() => { EventEmitter.defaultMaxListeners = 10; });
    after(() => { EventEmitter.defaultMaxListeners = 10; });

    it('returns 10 unless overriden', () => {
      expect(EventEmitter.defaultMaxListeners).to.eql(10);
    });

    it('allows the defaul to be overriden', () => {
      EventEmitter.defaultMaxListeners = 20;
      expect(EventEmitter.defaultMaxListeners).to.eql(20);
    });
  });

  describe('EventEmitter#getMaxListeners', () => {
    beforeEach(() => { EventEmitter.defaultMaxListeners = 10; });
    after(() => { EventEmitter.defaultMaxListeners = 10; });

    it('returns the default max listeners if none set for instance', () => {
      const emitter = new EventEmitter();
      expect(emitter.getMaxListeners()).to.eql(10);
    });

    it('returns an overriden default max', () => {
      const emitter = new EventEmitter();
      EventEmitter.defaultMaxListeners = 20;
      expect(emitter.getMaxListeners()).to.eql(20);
    });

    it('returns the max events set for that instance', () => {
      const emitter = new EventEmitter();
      emitter.setMaxListeners(5);
      expect(emitter.getMaxListeners()).to.eql(5);
    });
  });

  describe('EventEmitter#prependListener', () => {
    it('prepends a listener', () => {
      const emitter = new EventEmitter();
      let i = 0;
      let call1 = null;
      emitter.on('test', () => { call1 = i++; });
      let call2 = null;
      emitter.prependListener('test', () => { call2 = i++; });

      emitter.emit('test');

      expect(call1).to.eql(1);
      expect(call2).to.eql(0);
    });
  });

  describe('EventEmitter#eventNames', () => {
    it('returns the names of all registered events', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('another', noop);
      emitter.on('aThird', noop);

      expect(emitter.eventNames()).to.eql(['test', 'another', 'aThird']);
    });
  });

  describe('EventEmitter#rawListeners', () => {
    it('returns a copy of the array of listeners for the event named eventName, including any wrappers', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const listeners = emitter.rawListeners('test');
      expect(listeners[0]).to.eql(noop);
      expect(listeners[1]).to.be.instanceOf(Listener);
      expect(listeners[1].listener).to.eql(noop);

      expect(listeners).to.not.equal(emitter.events.test);
      expect(listeners).to.eql(emitter.events.test);
    });

    it('returns an empty array if there are no events', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const listeners = emitter.rawListeners('other');
      expect(listeners).to.eql([]);
    });
  });

  describe('EventEmitter#listeners', () => {
    it('returns a copy of the array of listeners for the event named eventName', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const listeners = emitter.listeners('test');
      expect(listeners[0]).to.eql(noop);
      expect(listeners[1]).to.eql(noop);

      expect(listeners).to.not.equal(emitter.events.test);
    });

    it('returns an empty array if there are no events', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const listeners = emitter.listeners('other');
      expect(listeners).to.eql([]);
    });
  });

  describe('EventEmitter#listenerCount', () => {
    it('returns the number of listeners listening to the event named eventName.', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const count = emitter.listenerCount('test');
      expect(count).to.eql(2);
    });

    it('returns the number of listeners listening to the event named eventName.', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      emitter.once('test', noop);

      const count = emitter.listenerCount('other');
      expect(count).to.eql(0);
    });
  });

  describe('EventEmitter#prependOnceListener', () => {
    it('prepends a once listener', () => {
      const emitter = new EventEmitter();

      emitter.on('test', noop);
      const fn = () => { };
      emitter.prependOnceListener('test', fn);

      const listeners = emitter.events.test;
      expect(listeners[0]).to.be.instanceOf(Listener);
      expect(listeners[0].listener).to.eql(fn);
      expect(listeners[1]).to.eql(noop);
    });

    it('throws an error if listener is not a function', () => {
      const emitter = new EventEmitter();
      try {
        emitter.prependOnceListener('test');
      } catch (e) {
        expect(e.message).to.equal('The "listener" argument must be of type Function. Received type undefined');
      }
    });
  });
});

describe('once', () => {
  it('returns a promise', () => {
    const emitter = new EventEmitter();
    expect(once(emitter)).to.be.instanceOf(Promise);
  });

  it('adds the event to be listened to once', () => {
    const emitter = new EventEmitter();
    once(emitter, 'test');
    expect(emitter.listeners('test')).to.have.lengthOf(1);
    expect(emitter.rawListeners('test')[0]).to.be.instanceOf(Listener);
  });

  it('adds an error event to be listened to', () => {
    const emitter = new EventEmitter();
    once(emitter, 'test');
    expect(emitter.listeners('error')).to.have.lengthOf(1);
  });

  it('resolves when the event is emitted', async () => {
    const emitter = new EventEmitter();
    const promise = once(emitter, 'test');
    emitter.emit('test', 42);
    const args = await promise;
    expect(args).to.eql([42]);
  });

  it('rejects if any errors are emitted', () => {
    const emitter = new EventEmitter();
    try {
      once(emitter, 'test');
      emitter.emit('error', Error('test err'));
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.message).to.eql('test err');
    }
  });
});

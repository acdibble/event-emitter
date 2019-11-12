import { expect } from 'chai';
import EventEmitter from '../src/index';

const noop = () => {};

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

      const events = emitter._events.test;
      expect(events).to.eql([noop]);
    });

    it('adds events to the same internal register', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('test', noop);

      const events = emitter._events.test;
      expect(events).to.eql([noop, noop]);
    });

    it('adds events to the same and different internal registers', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('test', noop);
      emitter.on('test2', noop);

      const events1 = emitter._events.test;
      expect(events1).to.eql([noop, noop]);

      const events2 = emitter._events.test2;
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
      const events = emitter._events.test;
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

      const events = emitter._events.test;
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
  });

  describe('EventEmitter#off', () => {
    it('is an alias of removeListener', () => {
      expect(EventEmitter.prototype.off).to.eql(EventEmitter.prototype.removeListener);
    });
  });

  describe('EventEmitter#once', () => {
    it('properly invokes once listeners', () => {
      let called1 = false;
      const fn1 = () => { called1 = true; };

      const emitter = new EventEmitter();
      emitter.once('test', fn1);
      emitter.emit('test');
      expect(called1).to.eql(true);
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

      expect(emitter._events.test).to.eql([fn1]);
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

      expect(emitter._events.test).to.eql([fn1]);
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
      expect(Object.keys(emitter._events).length).to.eql(0);
    });

    it('removes all listeners for a certain event', () => {
      const emitter = new EventEmitter();
      emitter.on('test', noop);
      emitter.on('another', noop);
      emitter.on('aThird', noop);

      emitter.removeAllListeners('test');
      expect(Object.keys(emitter._events).length).to.eql(2);

      expect(emitter._events.another).to.eql([noop]);
      expect(emitter._events.aThird).to.eql([noop]);
    });
  });

  describe('EventEmitter#setMaxListeners', () => {
    it('sets the max listeners to a non-negative number', () => {
      const emitter = new EventEmitter();
      emitter.setMaxListeners(15);
      expect(emitter._maxListeners).to.eql(15);
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
});

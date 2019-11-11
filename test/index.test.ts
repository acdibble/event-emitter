import { expect } from 'chai';
import EventEmitter from '../src/index';

const noop = () => {};

describe('EventEmitter', () => {
  it('is a constructor', () => {
    expect(new EventEmitter() instanceof EventEmitter).to.eql(true);
  });

  it('adds events to internal register', () => {
    const emitter = new EventEmitter();
    emitter.on('test', noop);

    const events = emitter._events.get('test');
    expect(events).to.eql({ listeners: [noop] });
  });
});

interface Listener {
  listener: Function;
  _events: (Function | Listener)[];
}

class Listener {
  constructor(fn: Function) {
    this.listener = fn;
  }

  call(ctx: any, ...args: any[]) {
    return this.listener.call(ctx, ...args);
  }
}

export default Listener;

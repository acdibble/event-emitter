interface Listener {
  listener: Function;
  _events: (Function | Listener)[];
}

class Listener {
  constructor(fn: Function) {
    this.listener = fn;
  }

  apply(ctx: any, args: any[]) {
    return this.listener.apply(ctx, args);
  }
}

export default Listener;

export default class Handler {
  setNext(handler) {
    this.next = handler;
    return handler; // allow chaining
  }

  async handle(req) {
    if (this.next) {
      return this.next.handle(req);
    }
    return req;
  }
}

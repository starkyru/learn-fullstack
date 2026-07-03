export type EventMap = Record<string, unknown>;
type Handler<T> = (payload: T) => void;

export class TypedEmitter<Events extends EventMap> {
  private readonly handlers = new Map<keyof Events, Handler<unknown>[]>();

  on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler as Handler<unknown>);
    this.handlers.set(event, list);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): boolean {
    const list = this.handlers.get(event);
    if (!list || list.length === 0) return false;
    // Snapshot: a handler that registers another during emit won't run in this pass.
    for (const handler of [...list]) (handler as Handler<Events[K]>)(payload);
    return true;
  }
}

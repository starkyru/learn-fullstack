export type EventMap = Record<string, unknown>;
type Handler<T> = (payload: T) => void;

/**
 * YOUR TURN — a type-safe event bus. `on(event, handler)` registers; `emit(event, payload)`
 * calls every handler for that event with the correctly typed payload. Keep handlers in a
 * `Map<keyof Events, Handler[]>`. `emit` returns whether any handler ran.
 */
export class TypedEmitter<Events extends EventMap> {
  on<K extends keyof Events>(_event: K, _handler: Handler<Events[K]>): void {
    throw new Error("TODO: register the handler for this event");
  }
  emit<K extends keyof Events>(_event: K, _payload: Events[K]): boolean {
    throw new Error("TODO: call each handler with the payload");
  }
}

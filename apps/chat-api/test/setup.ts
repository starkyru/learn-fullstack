// MUST be the first import in the whole test run: Nest's DI + gateway/guard metadata read the
// `Reflect.getMetadata(...)` API that this shim installs onto the global `Reflect`.
import "reflect-metadata";

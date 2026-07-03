// MUST be the first import in the whole test run: Nest's DI (task 4) reads the
// `Reflect.getMetadata(...)` API that this shim installs onto the global `Reflect`.
import "reflect-metadata";

import { Module } from "@nestjs/common";
import { BoardsResolver } from "./boards.resolver.js";
import { BoardsService, ID_SOURCE, SeqIdSource } from "./boards.service.js";

/** Wires the deterministic id source into the store, then exposes the store through the resolver. */
@Module({
  providers: [
    BoardsService,
    BoardsResolver,
    { provide: ID_SOURCE, useClass: SeqIdSource },
  ],
})
export class BoardsModule {}

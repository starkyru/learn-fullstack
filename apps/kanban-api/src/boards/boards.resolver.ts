/**
 * The GraphQL surface of the M0 slice:
 *   Query    { board(slug), boards }
 *   Mutation { createCard(columnId, title), moveCard(cardId, toColumnId) }
 *
 * All state lives in `BoardsService`; the resolver is a thin, typed adapter. `@Resolver(() => Board)`
 * roots the type; nested `Column`/`Card` fields resolve straight off the returned objects.
 */
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Board, Card } from "./board.model.js";
import { BoardsService } from "./boards.service.js";

@Resolver(() => Board)
export class BoardsResolver {
  constructor(private readonly service: BoardsService) {}

  @Query(() => [Board])
  boards(): Board[] {
    return this.service.findAll();
  }

  @Query(() => Board, { nullable: true })
  board(@Args("slug") slug: string): Board | null {
    return this.service.findBySlug(slug);
  }

  @Mutation(() => Card)
  createCard(
    @Args("columnId", { type: () => ID }) columnId: string,
    @Args("title") title: string,
  ): Card {
    return this.service.createCard(columnId, title);
  }

  @Mutation(() => Card)
  moveCard(
    @Args("cardId", { type: () => ID }) cardId: string,
    @Args("toColumnId", { type: () => ID }) toColumnId: string,
  ): Card {
    return this.service.moveCard(cardId, toColumnId);
  }
}

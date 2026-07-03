/**
 * Task 2 — Pipes & validation (TODO).
 *
 * Two flavors of pipe:
 *   1. `CreateCardDto` + Nest's built-in `ValidationPipe` — declarative body validation. Decorate
 *      the DTO with class-validator (`@IsString`, `@IsNotEmpty`, `@MaxLength(50)`) so that
 *      `new ValidationPipe({ whitelist: true, transform: true })` 400s bad bodies, strips unknown
 *      keys, and hands the controller a real DTO instance.
 *   2. `ParseIntParamPipe` — a hand-written `PipeTransform` for a `:id` route param.
 *
 * The custom pipe and the wiring THROW until you implement them.
 */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  ValidationPipe,
  type ArgumentMetadata,
  type PipeTransform,
} from "@nestjs/common";
// import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCardDto {
  // TODO: add `@IsString() @IsNotEmpty() @MaxLength(50)` so ValidationPipe can enforce it.
  title!: string;
}

/**
 * A `ParseIntPipe`-like custom pipe. Accept a base-10 integer string, reject everything else.
 * `"42"` → `42`; `"abc"`, `"4.2"`, `""`, `"42x"` → `BadRequestException`.
 *
 * Steps: test `value` against `/^-?\d+$/`; on miss `throw new BadRequestException(...)`; else
 * return `Number(value)`.
 */
@Injectable()
export class ParseIntParamPipe implements PipeTransform<string, number> {
  transform(_value: string, _metadata: ArgumentMetadata): number {
    throw new BadRequestException("TODO: parse an integer route param or 400");
  }
}

@Controller("cards")
export class PipesController {
  @Post()
  create(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) _dto: CreateCardDto,
  ): { created: string } {
    throw new Error("TODO: return { created: dto.title } once the DTO validates");
  }

  @Get(":id")
  get(@Param("id", ParseIntParamPipe) _id: number): { id: number; type: string } {
    throw new Error(
      "TODO: return { id, type: typeof id } (id parsed by ParseIntParamPipe)",
    );
  }
}

@Module({ controllers: [PipesController] })
export class PipesModule {}

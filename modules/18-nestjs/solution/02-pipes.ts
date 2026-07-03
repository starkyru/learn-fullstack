/**
 * Task 2 — Pipes & validation (SOLUTION).
 *
 * Two flavors of pipe:
 *   1. `CreateCardDto` + Nest's built-in `ValidationPipe` — declarative body validation. The DTO's
 *      class-validator decorators are the schema; `ValidationPipe({ whitelist, transform })` runs
 *      them and 400s on failure, strips unknown keys, and hands the controller a real DTO instance.
 *   2. `ParseIntParamPipe` — a hand-written `PipeTransform` that parses a `:id` route param into a
 *      number and throws `BadRequestException` on anything non-integer.
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
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string;
}

/**
 * A `ParseIntPipe`-like custom pipe. Accepts a base-10 integer string, rejects everything else.
 * Deliberately strict: `"42"` → `42`, but `"abc"`, `"4.2"`, `""` and `"42x"` all 400.
 */
@Injectable()
export class ParseIntParamPipe implements PipeTransform<string, number> {
  transform(value: string, _metadata: ArgumentMetadata): number {
    if (!/^-?\d+$/.test(value)) {
      throw new BadRequestException(`Validation failed: "${value}" is not an integer`);
    }
    return Number(value);
  }
}

@Controller("cards")
export class PipesController {
  @Post()
  create(
    @Body(new ValidationPipe({ whitelist: true, transform: true })) dto: CreateCardDto,
  ): {
    created: string;
    keys: string[];
    isDto: boolean;
  } {
    // Echo enough to make the pipe's effects observable over HTTP:
    //   `keys` proves `whitelist` stripped unknown props; `isDto` proves `transform` built a real
    //   CreateCardDto instance (not a plain object).
    return {
      created: dto.title,
      keys: Object.keys(dto),
      isDto: dto instanceof CreateCardDto,
    };
  }

  @Get(":id")
  get(@Param("id", ParseIntParamPipe) id: number): { id: number; type: string } {
    return { id, type: typeof id };
  }
}

@Module({ controllers: [PipesController] })
export class PipesModule {}

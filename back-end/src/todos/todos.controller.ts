/**
 * Todo CONTROLLER – HTTP routes for Todo CRUD (api/v1/todos).
 *
 * What it does:
 * - GET /todos (list), GET /todos/:id (one) – @Public() (no auth).
 * - POST, PATCH, DELETE – protected by JwtAuthGuard (Authorization: Bearer <token> from login).
 * Use @CurrentUser() to get request.user (JwtPayload) in protected handlers.
 *
 * If Bearer returns 401: ensure the token is from POST /auth/login and the module that uses the guard
 * imports AuthModule (see todos.module.ts). Use @CurrentUser() to read the authenticated user.
 *
 * @see common/decorators/current-user.decorator.ts
 * @see doc/back-end-guide.md §5.3 (Controller)
 */

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ListTodoQueryDto } from './dto/list-todo-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('todos')
@Controller('todos')
@UseGuards(JwtAuthGuard)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a todo (protected)' })
  @ApiBody({ type: CreateTodoDto })
  @ApiResponse({ status: 201, description: 'Todo created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(
    @Body() dto: CreateTodoDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.todosService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get list of todos (public)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'completed', required: false, enum: ['true', 'false'] })
  @ApiResponse({ status: 200, description: 'Paginated list' })
  findAll(@Query() query: ListTodoQueryDto) {
    return this.todosService.findAll(query);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one todo by id (protected)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Todo found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  findOne(@Param('id') id: string) {
    return this.todosService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a todo (protected)' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTodoDto })
  @ApiResponse({ status: 200, description: 'Todo updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  update(@Param('id') id: string, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a todo (protected)' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'Todo deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.todosService.remove(id);
    return { message: 'Todo deleted' };
  }
}

/**
 * Todo SERVICE – business logic and database access for Todo CRUD.
 *
 * What it does: create, findAll (paginated + filter by completed), findOne, update, remove.
 * Injects: Todo model via @InjectModel(Todo.name). Other modules can inject this service
 * only if TodosModule exports it (see todos.module.ts).
 *
 * Use cases:
 * - Controller calls these methods; keep controllers thin, put logic here.
 * - Export from TodosModule when another module needs to use TodosService (e.g. list todos in a report).
 *
 * @see https://docs.nestjs.com/providers
 * @see doc/back-end-guide.md §4.2 (Service)
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Todo, TodoDocument } from './schemas/todo.schema';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { ListTodoQueryDto } from './dto/list-todo-query.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectModel(Todo.name) private readonly todoModel: Model<TodoDocument>,
  ) {}

  async create(dto: CreateTodoDto): Promise<TodoDocument> {
    const created = new this.todoModel(dto);
    return created.save();
  }

  async findAll(
    query: ListTodoQueryDto,
  ): Promise<{ items: TodoDocument[]; total: number }> {
    const { page = 1, limit = 10, completed } = query;
    const filter: Record<string, unknown> = {};
    if (completed === 'true') filter.completed = true;
    if (completed === 'false') filter.completed = false;

    const [items, total] = await Promise.all([
      this.todoModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.todoModel.countDocuments(filter),
    ]);

    return { items, total };
  }

  async findOne(id: string): Promise<TodoDocument> {
    const todo = await this.todoModel.findById(id).exec();
    if (!todo) throw new NotFoundException(`Todo with id "${id}" not found`);
    return todo;
  }

  async update(id: string, dto: UpdateTodoDto): Promise<TodoDocument> {
    const todo = await this.todoModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!todo) throw new NotFoundException(`Todo with id "${id}" not found`);
    return todo;
  }

  async remove(id: string): Promise<void> {
    const result = await this.todoModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Todo with id "${id}" not found`);
  }
}

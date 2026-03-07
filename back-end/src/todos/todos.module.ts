/**
 * Todo feature MODULE – wires schema, controller, and service.
 *
 * What it does:
 * - imports: MongooseModule.forFeature([Todo]), AuthModule (so JwtAuthGuard can use JwtStrategy on protected routes).
 * - exports: TodosService so other modules can inject it.
 * - controllers/providers: TodosController, TodosService.
 *
 * Use cases:
 * - Import this module in AppModule to expose /api/v1/todos routes.
 * - Any module with protected routes (JwtAuthGuard) must import AuthModule so the JWT strategy is available.
 *
 * @see https://docs.nestjs.com/modules
 * @see doc/back-end-guide.md §5 (Module, Service, Controller, Import/Export)
 */

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { Todo, TodoSchema } from './schemas/todo.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Todo.name, schema: TodoSchema }]),
    AuthModule,
  ],
  controllers: [TodosController],
  providers: [TodosService],
  exports: [TodosService],
})
export class TodosModule {}

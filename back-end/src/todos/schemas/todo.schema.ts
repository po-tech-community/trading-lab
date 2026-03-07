/**
 * Todo Mongoose SCHEMA – shape of documents in the "todos" collection.
 *
 * What it does: Defines title (required), completed (default false), description (optional).
 * timestamps: true adds createdAt, updatedAt. Used in TodosModule via MongooseModule.forFeature([...]);
 * TodosService injects the model with @InjectModel(Todo.name).
 *
 * Use cases: Add @Prop() for new fields; register in the module's imports.
 *
 * @see https://docs.nestjs.com/techniques/mongodb
 */

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TodoDocument = Todo & Document;

@Schema({ timestamps: true })
export class Todo {
  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop()
  description?: string;
}

export const TodoSchema = SchemaFactory.createForClass(Todo);

/**
 * Users feature MODULE (stub) – Level 0 user profile.
 *
 * What to add: User schema (Mongoose), UsersController (GET/PATCH /users/me), UsersService.
 * Import MongooseModule.forFeature([UserSchema]). Export UsersService if AuthModule needs it.
 *
 * @see doc/developer-tasks.md L0-BE-* (task list)
 * @see doc/back-end-guide.md §4, §5
 * @see https://docs.nestjs.com/techniques/mongodb
 */
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

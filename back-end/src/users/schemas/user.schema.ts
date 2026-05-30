import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true, maxlength: 100 })
  firstName: string;

  @Prop({ required: true, trim: true, maxlength: 100 })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, default: null, index: true })
  googleId?: string | null;

  @Prop({ type: String, default: null })
  avatarUrl: string | null;

  /**
   * Incremented on every logout. The refresh token embeds this version at
   * sign time; on refresh the version in the token must match this field.
   * A mismatch means the token was issued before the last logout → rejected.
   */
  @Prop({ type: Number, default: 0 })
  tokenVersion: number;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  createdAt: Date;

  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

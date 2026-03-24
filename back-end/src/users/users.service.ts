import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { UpdateUserDto } from './dto/update-user.dto';

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  avatarUrl?: string;
  googleId?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: {
    firstName: string;
    lastName: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string | null;
    googleId?: string;
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      avatarUrl: data.avatarUrl ?? null,
      googleId: data.googleId,
    });
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      _id: id,
      deletedAt: null,
    });
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      updateData,
      {new:true},
    );

    if (!user) {
      throw new Error('User not found')
    }

    return user;
  }
}

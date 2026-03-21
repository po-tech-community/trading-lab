import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema.js';
import { NotFoundException } from '@nestjs/common';
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
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
    });
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });
  }

  async findById(userId: string) {
    const user = await this.userModel.findOne({
      _id: userId,
      deletedAt: null,
    });
  
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    };
  }

  async updateMe(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
  },
) {
  const updatedUser = await this.userModel.findOneAndUpdate(
    {
      _id: userId,
      deletedAt: null,
    },
    {
      ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
      ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedUser) {
    return null;
  }

  return {
    id: updatedUser._id.toString(),
    email: updatedUser.email,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
  };
}
  async findProfileByEmail(email: string) {
    const user = await this.userModel.findOne({
      email,
      deletedAt: null,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    };
  }
  
  async updateMeByEmail(
    email: string,
    data: {
      firstName?: string;
      lastName?: string;
    },
  ) {
    const updatedUser = await this.userModel.findOneAndUpdate(
      {
        email,
        deletedAt: null,
      },
      {
        ...(data.firstName !== undefined ? { firstName: data.firstName } : {}),
        ...(data.lastName !== undefined ? { lastName: data.lastName } : {}),
      },
      {
        new: true,
        runValidators: true,
      },
    );
  
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
  
    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName ?? '',
      lastName: updatedUser.lastName ?? '',
    };
  }
}
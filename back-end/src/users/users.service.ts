import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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
  googleId?: string | null;
  avatarUrl?: string;
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
    googleId?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserDocument> {
    const user = await this.userModel.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      googleId: data.googleId ?? null,
      avatarUrl: data.avatarUrl ?? null,
    });
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      email: email.toLowerCase(),
      deletedAt: null,
    });
  }

  async findById(userId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({
      _id: userId,
      deletedAt: null,
    });
  }

  async updateById(
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

  async updateByEmail(
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

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        googleId,
        deletedAt: null,
      })
      .exec();
  }

  async linkGoogleAccount(
    id: string,
    googleId: string,
    avatarUrl?: string | null,
  ): Promise<UserDocument | null> {
    const fields: Record<string, unknown> = { googleId };
    if (avatarUrl !== undefined) {
      fields.avatarUrl = avatarUrl;
    }

    return this.userModel
      .findByIdAndUpdate(id, fields, { new: true })
      .exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    const { password, currentPassword, ...rest } = dto;
    const fields: Record<string, unknown> = { ...rest };

    if (password) {
      if (!currentPassword) {
        throw new BadRequestException(
          'Current password is required to set a new password',
        );
      }
      const user = await this.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      fields.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.userModel.findByIdAndUpdate(id, fields, { new: true }).exec();
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(id, { deletedAt: new Date() })
      .exec();
  }
}

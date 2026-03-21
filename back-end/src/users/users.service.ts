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
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const user = new this.userModel({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      passwordHash: input.passwordHash,
      avatarUrl: input.avatarUrl,
    });
    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email, deletedAt: null })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, deletedAt: null })
      .exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument | null> {
    const { password, currentPassword, ...rest } = dto;
    const fields: Record<string, unknown> = { ...rest };

    if (password) {
      if (!currentPassword) {
        throw new BadRequestException('Current password is required to set a new password');
      }
      const user = await this.findById(id);
      const isValid = await bcrypt.compare(currentPassword, user!.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      fields.passwordHash = await bcrypt.hash(password, 10);
    }

    return this.userModel
      .findByIdAndUpdate(id, fields, { new: true })
      .exec();
  }
}


import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema.js';
import { CreateUserDto } from '../dto/create-user.dto.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../../common/enums/technician-status.enum.js';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const user = new this.userModel(createUserDto);
    return user.save();
  }

  async findById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userModel.exists({ email });
    return !!user;
  }

  /** Find all technicians */
  async findTechnicians(): Promise<UserDocument[]> {
    return this.userModel.find({ role: UserRole.TECHNICIAN }).exec();
  }

  async deleteById(id: Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  /** Update technician's work status */
  async updateTechnicianStatus(
    id: Types.ObjectId,
    status: TechnicianStatus,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { technicianStatus: status }, { new: true })
      .exec();
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  MachineType,
  MachineTypeDocument,
} from '../schemas/machine-type.schema.js';

@Injectable()
export class MachineTypeRepository {
  constructor(
    @InjectModel(MachineType.name)
    private readonly machineTypeModel: Model<MachineTypeDocument>,
  ) {}

  async create(data: Partial<MachineType>): Promise<MachineTypeDocument> {
    return new this.machineTypeModel(data).save();
  }

  async findById(id: Types.ObjectId): Promise<MachineTypeDocument | null> {
    return this.machineTypeModel.findById(id).exec();
  }

  async findAll(): Promise<MachineTypeDocument[]> {
    return this.machineTypeModel.find().sort({ name: 1 }).exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<MachineType>,
  ): Promise<MachineTypeDocument | null> {
    return this.machineTypeModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<MachineTypeDocument | null> {
    return this.machineTypeModel.findByIdAndDelete(id).exec();
  }
}

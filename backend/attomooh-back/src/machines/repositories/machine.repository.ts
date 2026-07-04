import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Machine, MachineDocument } from '../schemas/machine.schema.js';

@Injectable()
export class MachineRepository {
  constructor(
    @InjectModel(Machine.name)
    private readonly machineModel: Model<MachineDocument>,
  ) {}

  async create(data: Partial<Machine>): Promise<MachineDocument> {
    const doc = await new this.machineModel(data).save();
    return this.findById(doc._id) as Promise<MachineDocument>;
  }

  async findById(id: Types.ObjectId): Promise<MachineDocument | null> {
    return this.machineModel
      .findById(id)
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async findAll(): Promise<MachineDocument[]> {
    return this.machineModel
      .find()
      .sort({ createdAt: -1 })
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async search(query: string): Promise<MachineDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.machineModel
      .find({ $or: [{ name: regex }, { customId: regex }] })
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .sort({ name: 1 })
      .exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<Machine>,
  ): Promise<MachineDocument | null> {
    return this.machineModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('technician1', 'name phone')
      .populate('technician2', 'name phone')
      .populate('technician3', 'name phone')
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<MachineDocument | null> {
    return this.machineModel.findByIdAndDelete(id).exec();
  }
}

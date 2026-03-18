import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MachineDelivery, MachineDeliveryDocument } from '../schemas/machine-delivery.schema.js';

@Injectable()
export class MachineDeliveryRepository {
  constructor(@InjectModel(MachineDelivery.name) private readonly model: Model<MachineDeliveryDocument>) {}

  async create(data: Partial<MachineDelivery>): Promise<MachineDeliveryDocument> { return new this.model(data).save(); }
  async findById(id: Types.ObjectId): Promise<MachineDeliveryDocument | null> { return this.model.findById(id).populate('machineReception').populate('deliveredBy', 'name phone').exec(); }
  async findAll(): Promise<MachineDeliveryDocument[]> { return this.model.find().sort({ createdAt: -1 }).populate('machineReception').populate('deliveredBy', 'name phone').exec(); }
  async updateById(id: Types.ObjectId, data: Partial<MachineDelivery>): Promise<MachineDeliveryDocument | null> { return this.model.findByIdAndUpdate(id, data, { new: true }).exec(); }
  async deleteById(id: Types.ObjectId): Promise<MachineDeliveryDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transport, TransportDocument } from '../schemas/transport.schema.js';

@Injectable()
export class TransportRepository {
  constructor(@InjectModel(Transport.name) private readonly model: Model<TransportDocument>) {}
  async create(data: Partial<Transport>): Promise<TransportDocument> { return new this.model(data).save(); }
  async findById(id: Types.ObjectId): Promise<TransportDocument | null> { return this.model.findById(id).populate('machineReception').populate('logistic', 'name phone').exec(); }
  async findAll(): Promise<TransportDocument[]> { return this.model.find().sort({ createdAt: -1 }).populate('machineReception').populate('logistic', 'name phone').exec(); }
  async updateById(id: Types.ObjectId, data: Partial<Transport>): Promise<TransportDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).exec();
  }
  async deleteById(id: Types.ObjectId): Promise<TransportDocument | null> { return this.model.findByIdAndDelete(id).exec(); }
}

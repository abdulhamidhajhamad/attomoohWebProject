import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transport, TransportDocument } from '../schemas/transport.schema.js';

@Injectable()
export class TransportRepository {
  constructor(
    @InjectModel(Transport.name)
    private readonly model: Model<TransportDocument>,
  ) {}
  async create(data: Partial<Transport>): Promise<TransportDocument> {
    const doc = await new this.model(data).save();
    return this.model
      .findById(doc._id)
      .populate('machineReception')
      .populate('logistic', 'name phone')
      .orFail()
      .exec();
  }
  async findById(id: Types.ObjectId): Promise<TransportDocument | null> {
    return this.model
      .findById(id)
      .populate('machineReception')
      .populate('logistic', 'name phone')
      .exec();
  }
  async findAll(
    params: { search?: string } = {},
  ): Promise<TransportDocument[]> {
    const filter: Record<string, unknown> = {};
    if (params.search) {
      const rx = new RegExp(params.search, 'i');
      filter.$or = [
        { machineName: rx },
        { machineDetails: rx },
        { logisticName: rx },
        { logisticReport: rx },
        { pauseReason: rx },
      ];
    }
    return this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('machineReception')
      .populate('logistic', 'name phone')
      .exec();
  }
  async updateById(
    id: Types.ObjectId,
    data: Partial<Transport>,
  ): Promise<TransportDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('machineReception')
      .populate('logistic', 'name phone')
      .exec();
  }
  async deleteById(id: Types.ObjectId): Promise<TransportDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}

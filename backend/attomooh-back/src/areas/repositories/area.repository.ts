import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Area, AreaDocument } from '../schemas/area.schema.js';
import { escapeRegex } from '../../common/utils/regex.js';

@Injectable()
export class AreaRepository {
  constructor(
    @InjectModel(Area.name)
    private readonly areaModel: Model<AreaDocument>,
  ) {}

  async create(data: Partial<Area>): Promise<AreaDocument> {
    return new this.areaModel(data).save();
  }

  async findById(id: Types.ObjectId): Promise<AreaDocument | null> {
    return this.areaModel.findById(id).exec();
  }

  async findAll(): Promise<AreaDocument[]> {
    return this.areaModel.find().sort({ createdAt: -1 }).exec();
  }

  async search(query: string): Promise<AreaDocument[]> {
    const regex = new RegExp(escapeRegex(query), 'i');
    return this.areaModel.find({ name: regex }).sort({ name: 1 }).exec();
  }

  async updateById(
    id: Types.ObjectId,
    data: Partial<Area>,
  ): Promise<AreaDocument | null> {
    return this.areaModel
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .exec();
  }

  async deleteById(id: Types.ObjectId): Promise<AreaDocument | null> {
    return this.areaModel.findByIdAndDelete(id).exec();
  }
}

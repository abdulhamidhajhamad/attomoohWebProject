import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tool, ToolDocument } from '../schemas/tool.schema.js';

@Injectable()
export class ToolRepository {
  constructor(
    @InjectModel(Tool.name) private readonly model: Model<ToolDocument>,
  ) {}

  async create(data: Partial<Tool>): Promise<ToolDocument> {
    const doc = await new this.model(data).save();
    return this.findById(doc._id) as Promise<ToolDocument>;
  }
  async findById(id: Types.ObjectId): Promise<ToolDocument | null> {
    return this.model
      .findById(id)
      .populate('responsibleTechnician', 'name phone')
      .exec();
  }
  async findAll(): Promise<ToolDocument[]> {
    return this.model
      .find()
      .sort({ createdAt: -1 })
      .populate('responsibleTechnician', 'name phone')
      .exec();
  }
  async search(query: string): Promise<ToolDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.model
      .find({ $or: [{ name: regex }, { customId: regex }] })
      .populate('responsibleTechnician', 'name phone')
      .sort({ name: 1 })
      .exec();
  }
  async updateById(
    id: Types.ObjectId,
    data: Partial<Tool>,
  ): Promise<ToolDocument | null> {
    return this.model
      .findByIdAndUpdate(id, data, { returnDocument: 'after' })
      .populate('responsibleTechnician', 'name phone')
      .exec();
  }
  async deleteById(id: Types.ObjectId): Promise<ToolDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}

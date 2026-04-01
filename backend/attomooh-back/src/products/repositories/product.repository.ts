import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema.js';

@Injectable()
export class ProductRepository {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(data: Partial<Product>): Promise<ProductDocument> {
    const product = new this.productModel(data);
    return product.save();
  }

  async findAll(): Promise<ProductDocument[]> {
    return this.productModel
      .find()
      .populate('categories', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: Types.ObjectId): Promise<ProductDocument | null> {
    return this.productModel
      .findById(id)
      .populate('categories', 'name description')
      .exec();
  }

  async findByCategory(
    categoryId: Types.ObjectId,
  ): Promise<ProductDocument[]> {
    return this.productModel
      .find({ categories: categoryId })
      .populate('categories', 'name description')
      .sort({ createdAt: -1 })
      .exec();
  }

  async delete(id: Types.ObjectId): Promise<ProductDocument | null> {
    return this.productModel.findByIdAndDelete(id).exec();
  }

  async update(
    id: Types.ObjectId,
    data: Partial<Product>,
  ): Promise<ProductDocument | null> {
    return this.productModel
      .findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after' })
      .populate('categories', 'name description')
      .exec();
  }

  async deleteManyByCategory(categoryId: Types.ObjectId): Promise<number> {
    const result = await this.productModel
      .deleteMany({ categories: categoryId })
      .exec();
    return result.deletedCount;
  }
}

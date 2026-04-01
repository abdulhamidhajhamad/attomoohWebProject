import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Employee, EmployeeDocument } from '../schemas/employee.schema.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { TechnicianStatus } from '../../common/enums/technician-status.enum.js';

@Injectable()
export class EmployeeRepository {
  constructor(@InjectModel(Employee.name) private readonly model: Model<EmployeeDocument>) {}

  async create(data: Partial<Employee>): Promise<EmployeeDocument> {
    return new this.model(data).save();
  }

  async findById(id: Types.ObjectId): Promise<EmployeeDocument | null> {
    return this.model.findById(id).populate('area').exec();
  }

  async findAll(): Promise<EmployeeDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).populate('area').exec();
  }

  async search(query: string): Promise<EmployeeDocument[]> {
    const regex = new RegExp(query, 'i');
    return this.model.find({ $or: [{ name: regex }, { phone: regex }] }).populate('area').sort({ name: 1 }).exec();
  }

  async updateById(id: Types.ObjectId, data: Partial<Employee>): Promise<EmployeeDocument | null> {
    return this.model.findByIdAndUpdate(id, data, { returnDocument: 'after' }).populate('area').exec();
  }

  async deleteById(id: Types.ObjectId): Promise<EmployeeDocument | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  /* ── Auth-related methods (absorbed from UserRepository) ── */

  async findByEmail(email: string): Promise<EmployeeDocument | null> {
    return this.model.findOne({ email }).select('+password').exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const doc = await this.model.exists({ email });
    return !!doc;
  }

  async findTechnicians(): Promise<EmployeeDocument[]> {
    return this.model.find({ role: UserRole.TECHNICIAN }).exec();
  }

  async updateTechnicianStatus(id: Types.ObjectId, status: TechnicianStatus): Promise<EmployeeDocument | null> {
    return this.model.findByIdAndUpdate(id, { technicianStatus: status }, { returnDocument: 'after' }).exec();
  }
}

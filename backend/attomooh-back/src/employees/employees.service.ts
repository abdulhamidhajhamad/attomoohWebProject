import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { EmployeeRepository } from './repositories/employee.repository.js';
import { EmployeeDocument } from './schemas/employee.schema.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';
import { EmployeeCategory } from '../common/enums/employee-category.enum.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';

@Injectable()
export class EmployeesService {
  private readonly SALT_ROUNDS: number;

  constructor(
    private readonly repo: EmployeeRepository,
    private readonly idGen: IdGeneratorService,
    private readonly configService: ConfigService,
  ) {
    this.SALT_ROUNDS = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10));
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeDocument> {
    // Check email uniqueness if provided
    if (dto.email) {
      const exists = await this.repo.existsByEmail(dto.email);
      if (exists) throw new ConflictException('Email already exists');
    }

    const customId = dto.customId || (await this.idGen.generateId(IdPrefix.EMPLOYEE));

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (dto.password) {
      hashedPassword = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    return this.repo.create({
      customId,
      name: dto.name,
      phone: dto.phone ?? '',
      jobTitle: dto.jobTitle ?? '',
      category: dto.category ?? EmployeeCategory.PERMANENT,
      area: dto.area ? new Types.ObjectId(dto.area) : undefined,
      address: dto.address ?? '',
      notes: dto.notes ?? '',
      isActive: dto.isActive ?? true,
      email: dto.email ?? null,
      password: hashedPassword ?? null,
      role: dto.role ?? null,
    });
  }

  async findAll(): Promise<EmployeeDocument[]> {
    return this.repo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<EmployeeDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Employee not found');
    return doc;
  }

  async search(query: string): Promise<EmployeeDocument[]> {
    return this.repo.search(query);
  }

  async update(id: Types.ObjectId, dto: UpdateEmployeeDto): Promise<EmployeeDocument> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Employee not found');

    const data: Record<string, unknown> = {};

    // Basic fields
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.jobTitle !== undefined) data.jobTitle = dto.jobTitle;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.technicianStatus !== undefined) data.technicianStatus = dto.technicianStatus;

    if (dto.area !== undefined) data.area = dto.area ? new Types.ObjectId(dto.area) : undefined;

    // System access: email/role/password
    if (dto.email !== undefined) {
      if (dto.email) {
        const other = await this.repo.findByEmail(dto.email);
        if (other && other._id.toString() !== id.toString()) {
          throw new ConflictException('Email already exists');
        }
        data.email = dto.email;
      } else {
        data.email = null;
        data.role = null;
        data.password = null;
      }
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    }

    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Employee not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Employee not found');
  }

  /* ── Auth-related methods (absorbed from UserService) ── */

  async findByEmail(email: string): Promise<EmployeeDocument | null> {
    return this.repo.findByEmail(email);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsByEmail(email);
  }

  async findTechnicians(): Promise<EmployeeDocument[]> {
    return this.repo.findTechnicians();
  }

  async updateTechnicianStatus(id: Types.ObjectId, status: TechnicianStatus): Promise<EmployeeDocument> {
    const updated = await this.repo.updateTechnicianStatus(id, status);
    if (!updated) throw new NotFoundException('Employee not found');
    return updated;
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CustomerRepository } from './repositories/customer.repository.js';
import { CustomerDocument } from './schemas/customer.schema.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { IdGeneratorService } from '../common/services/id-generator.service.js';
import { IdPrefix } from '../common/enums/id-prefix.enum.js';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customerRepo: CustomerRepository,
    private readonly idGenerator: IdGeneratorService,
  ) {}

  async create(dto: CreateCustomerDto): Promise<CustomerDocument> {
    const customId =
      dto.customId || (await this.idGenerator.generateId(IdPrefix.CUSTOMER));
    return this.customerRepo.create({
      customId,
      name: dto.name,
      phone: dto.phone,
      area: dto.area ? new Types.ObjectId(dto.area) : undefined,
      address: dto.address ?? '',
      notes: dto.notes ?? '',
      technician1: dto.technician1
        ? new Types.ObjectId(dto.technician1)
        : undefined,
      technician2: dto.technician2
        ? new Types.ObjectId(dto.technician2)
        : undefined,
      technician3: dto.technician3
        ? new Types.ObjectId(dto.technician3)
        : undefined,
    });
  }

  async findAll(): Promise<CustomerDocument[]> {
    return this.customerRepo.findAll();
  }

  async findById(id: Types.ObjectId): Promise<CustomerDocument> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async search(query: string): Promise<CustomerDocument[]> {
    return this.customerRepo.search(query);
  }

  async update(
    id: Types.ObjectId,
    dto: UpdateCustomerDto,
  ): Promise<CustomerDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.area !== undefined)
      data.area = dto.area ? new Types.ObjectId(dto.area) : undefined;
    if (dto.technician1 !== undefined)
      data.technician1 = dto.technician1
        ? new Types.ObjectId(dto.technician1)
        : undefined;
    if (dto.technician2 !== undefined)
      data.technician2 = dto.technician2
        ? new Types.ObjectId(dto.technician2)
        : undefined;
    if (dto.technician3 !== undefined)
      data.technician3 = dto.technician3
        ? new Types.ObjectId(dto.technician3)
        : undefined;
    const updated = await this.customerRepo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Customer not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.customerRepo.deleteById(id);
    if (!deleted) throw new NotFoundException('Customer not found');
  }
}

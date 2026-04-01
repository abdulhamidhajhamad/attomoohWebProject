import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CustomerCallRepository } from './repositories/customer-call.repository.js';
import { CustomerCallDocument } from './schemas/customer-call.schema.js';
import { CreateCustomerCallDto } from './dto/create-customer-call.dto.js';
import { UpdateCustomerCallDto } from './dto/update-customer-call.dto.js';

@Injectable()
export class CustomerCallService {
  constructor(private readonly repo: CustomerCallRepository) {}

  async create(dto: CreateCustomerCallDto): Promise<CustomerCallDocument> {
    return this.repo.create({
      customer: dto.customer ? new Types.ObjectId(dto.customer) : null,
      customerName: dto.customerName ?? '',
      customerPhone: dto.customerPhone ?? '',
      customerAddress: dto.customerAddress ?? '',
      machine: dto.machine ? new Types.ObjectId(dto.machine) : null,
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      warranty: dto.warranty ?? false,
      customerProblemDesc: dto.customerProblemDesc ?? '',
      solution: dto.solution ?? '',
      notes: dto.notes ?? '',
      receivedBy: dto.receivedBy ? new Types.ObjectId(dto.receivedBy) : null,
      receivedByName: dto.receivedByName ?? '',
    });
  }

  async findAll(search?: string): Promise<CustomerCallDocument[]> {
    return this.repo.findAll(search);
  }

  async findById(id: Types.ObjectId): Promise<CustomerCallDocument> {
    const d = await this.repo.findById(id);
    if (!d) throw new NotFoundException('Customer call not found');
    return d;
  }

  async update(id: Types.ObjectId, dto: UpdateCustomerCallDto): Promise<CustomerCallDocument> {
    const data: Record<string, unknown> = { ...dto };

    if (dto.customer !== undefined) {
      data.customer = dto.customer ? new Types.ObjectId(dto.customer) : null;
    }

    if (dto.machine !== undefined) {
      data.machine = dto.machine ? new Types.ObjectId(dto.machine) : null;
    }

    if (dto.receivedBy !== undefined || dto.receivedByName !== undefined) {
      if (dto.receivedBy) {
        data.receivedBy = new Types.ObjectId(dto.receivedBy);
        if (dto.receivedByName === undefined) data.receivedByName = '';
      } else if (dto.receivedByName && dto.receivedByName.trim()) {
        data.receivedBy = null;
      } else if (dto.receivedBy === '' || dto.receivedByName === '') {
        data.receivedBy = null;
        data.receivedByName = '';
      }
    }

    const u = await this.repo.updateById(id, data as any);
    if (!u) throw new NotFoundException('Customer call not found');
    return u;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.repo.deleteById(id);
  }
}

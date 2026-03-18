import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { MaintenanceScheduleRepository } from './repositories/maintenance-schedule.repository.js';
import { MaintenanceScheduleDocument } from './schemas/maintenance-schedule.schema.js';
import { CreateMaintenanceScheduleDto } from './dto/create-maintenance-schedule.dto.js';
import { UpdateMaintenanceScheduleDto } from './dto/update-maintenance-schedule.dto.js';
import { ScheduleStatus } from '../../common/enums/schedule-status.enum.js';

@Injectable()
export class MaintenanceScheduleService {
  constructor(private readonly repo: MaintenanceScheduleRepository) {}

  async create(dto: CreateMaintenanceScheduleDto): Promise<MaintenanceScheduleDocument> {
    return this.repo.create({
      machineReception: new Types.ObjectId(dto.machineReception),
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      technician: dto.technician ? new Types.ObjectId(dto.technician) : undefined,
      technicianName: dto.technicianName ?? '',
      scheduledDate: new Date(dto.scheduledDate),
      scheduledTime: dto.scheduledTime ?? '',
    });
  }

  async findAll(): Promise<MaintenanceScheduleDocument[]> { return this.repo.findAll(); }

  async findByDateRange(from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> { return this.repo.findByDateRange(from, to); }

  async findById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument> {
    const d = await this.repo.findById(id);
    if (!d) throw new NotFoundException('Maintenance schedule not found');
    return d;
  }

  async update(id: Types.ObjectId, dto: UpdateMaintenanceScheduleDto): Promise<MaintenanceScheduleDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.technician !== undefined) data.technician = dto.technician ? new Types.ObjectId(dto.technician) : undefined;
    if (dto.rescheduledTechnician !== undefined) data.rescheduledTechnician = dto.rescheduledTechnician ? new Types.ObjectId(dto.rescheduledTechnician) : undefined;
    if (dto.scheduledDate !== undefined) data.scheduledDate = new Date(dto.scheduledDate);
    if (dto.rescheduledDate !== undefined) data.rescheduledDate = dto.rescheduledDate ? new Date(dto.rescheduledDate) : undefined;
    const u = await this.repo.updateById(id, data as any);
    if (!u) throw new NotFoundException('Maintenance schedule not found');
    return u;
  }

  async reschedule(id: Types.ObjectId, dto: UpdateMaintenanceScheduleDto): Promise<MaintenanceScheduleDocument> {
    const d = await this.findById(id);
    d.status = ScheduleStatus.RESCHEDULED;
    if (dto.rescheduledTechnician) d.rescheduledTechnician = new Types.ObjectId(dto.rescheduledTechnician);
    if (dto.rescheduledDate) d.rescheduledDate = new Date(dto.rescheduledDate);
    if (dto.rescheduledTime !== undefined) d.rescheduledTime = dto.rescheduledTime;
    if (dto.rescheduleReason !== undefined) d.rescheduleReason = dto.rescheduleReason;
    return d.save();
  }

  async cancel(id: Types.ObjectId, reason: string): Promise<MaintenanceScheduleDocument> {
    const d = await this.findById(id);
    d.status = ScheduleStatus.CANCELLED;
    d.cancellationReason = reason ?? '';
    return d.save();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const d = await this.repo.deleteById(id);
    if (!d) throw new NotFoundException('Maintenance schedule not found');
  }
}

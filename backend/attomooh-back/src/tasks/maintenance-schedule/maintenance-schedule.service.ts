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
      technician: dto.technician ? new Types.ObjectId(dto.technician) : null,
      technicianName: dto.technicianName ?? '',
      scheduledDate: new Date(dto.scheduledDate),
      scheduledTime: dto.scheduledTime,
    });
  }

  async findAll(search?: string): Promise<MaintenanceScheduleDocument[]> {
    return this.repo.findAll(search);
  }

  async findByDateRange(from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> { return this.repo.findByDateRange(from, to); }

  async findForTechnicianByDateRange(technicianId: Types.ObjectId, from: Date, to: Date): Promise<MaintenanceScheduleDocument[]> {
    return this.repo.findForTechnicianByDateRange(technicianId, from, to);
  }

  async findById(id: Types.ObjectId): Promise<MaintenanceScheduleDocument> {
    const d = await this.repo.findById(id);
    if (!d) throw new NotFoundException('Maintenance schedule not found');
    return d;
  }

  async update(id: Types.ObjectId, dto: UpdateMaintenanceScheduleDto): Promise<MaintenanceScheduleDocument> {
    const data: Record<string, unknown> = { ...dto };

    if (dto.machineReception !== undefined) {
      data.machineReception = new Types.ObjectId(dto.machineReception);
    }

    if (dto.technician !== undefined || dto.technicianName !== undefined) {
      if (dto.technician) {
        data.technician = new Types.ObjectId(dto.technician);
        if (dto.technicianName === undefined) data.technicianName = '';
      } else if (dto.technicianName && dto.technicianName.trim()) {
        data.technician = null;
      } else if (dto.technician === '' || dto.technicianName === '') {
        data.technician = null;
        data.technicianName = '';
      }
    }

    if (dto.rescheduledTechnician !== undefined || dto.rescheduledTechnicianName !== undefined) {
      if (dto.rescheduledTechnician) {
        data.rescheduledTechnician = new Types.ObjectId(dto.rescheduledTechnician);
        if (dto.rescheduledTechnicianName === undefined) data.rescheduledTechnicianName = '';
      } else if (dto.rescheduledTechnicianName && dto.rescheduledTechnicianName.trim()) {
        data.rescheduledTechnician = null;
      } else if (dto.rescheduledTechnician === '' || dto.rescheduledTechnicianName === '') {
        data.rescheduledTechnician = null;
        data.rescheduledTechnicianName = '';
      }
    }

    if (dto.scheduledDate !== undefined) data.scheduledDate = new Date(dto.scheduledDate);
    if (dto.rescheduledDate !== undefined) data.rescheduledDate = dto.rescheduledDate ? new Date(dto.rescheduledDate) : null;

    const u = await this.repo.updateById(id, data as any);
    if (!u) throw new NotFoundException('Maintenance schedule not found');
    return u;
  }

  async reschedule(id: Types.ObjectId, dto: UpdateMaintenanceScheduleDto): Promise<MaintenanceScheduleDocument> {
    const data: Record<string, unknown> = {
      status: ScheduleStatus.RESCHEDULED,
    };

    if (dto.rescheduledTechnician) {
      data.rescheduledTechnician = new Types.ObjectId(dto.rescheduledTechnician);
      data.rescheduledTechnicianName = '';
    } else if (dto.rescheduledTechnicianName && dto.rescheduledTechnicianName.trim()) {
      data.rescheduledTechnician = null;
      data.rescheduledTechnicianName = dto.rescheduledTechnicianName;
    }

    if (dto.rescheduledDate) data.rescheduledDate = new Date(dto.rescheduledDate);
    if (dto.rescheduledTime !== undefined) data.rescheduledTime = dto.rescheduledTime;
    if (dto.rescheduleReason !== undefined) data.rescheduleReason = dto.rescheduleReason;

    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Maintenance schedule not found');
    return updated;
  }

  async cancel(id: Types.ObjectId, reason: string): Promise<MaintenanceScheduleDocument> {
    const updated = await this.repo.updateById(id, {
      status: ScheduleStatus.CANCELLED,
      cancellationReason: reason ?? '',
    });
    if (!updated) throw new NotFoundException('Maintenance schedule not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    await this.repo.deleteById(id);
  }
}

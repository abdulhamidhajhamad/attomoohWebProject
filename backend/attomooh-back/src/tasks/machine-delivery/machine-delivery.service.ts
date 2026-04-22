import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MachineDeliveryRepository } from './repositories/machine-delivery.repository.js';
import { MachineDeliveryDocument } from './schemas/machine-delivery.schema.js';
import { CreateMachineDeliveryDto } from './dto/create-machine-delivery.dto.js';
import { UpdateMachineDeliveryDto } from './dto/update-machine-delivery.dto.js';
import { MachineReception, MachineReceptionDocument } from '../machine-reception/schemas/machine-reception.schema.js';
import { MachineInspection, MachineInspectionDocument } from '../machine-inspection/schemas/machine-inspection.schema.js';
import { MachineMaint, MachineMaintDocument } from '../machine-maintenance/schemas/machine-maint.schema.js';
import { MachineInstallation, MachineInstallationDocument } from '../machine-installation/schemas/machine-installation.schema.js';
import { MachineProduction, MachineProductionDocument } from '../machine-production/schemas/machine-production.schema.js';
import { ReceptionStatus } from '../../common/enums/reception-status.enum.js';

type DeliveryTaskType = 'inspection' | 'maintenance' | 'installation' | 'production';

type DeliveryTaskDocument =
  | MachineInspectionDocument
  | MachineMaintDocument
  | MachineInstallationDocument
  | MachineProductionDocument;

interface DeliveryTaskCandidate {
  type: DeliveryTaskType;
  doc: DeliveryTaskDocument;
}

interface DeliveryTaskResolution {
  task: DeliveryTaskCandidate | null;
  hasTasks: boolean;
}

@Injectable()
export class MachineDeliveryService {
  constructor(
    private readonly repo: MachineDeliveryRepository,
    @InjectModel(MachineReception.name)
    private readonly receptionModel: Model<MachineReceptionDocument>,
    @InjectModel(MachineInspection.name)
    private readonly inspectionModel: Model<MachineInspectionDocument>,
    @InjectModel(MachineMaint.name)
    private readonly maintenanceModel: Model<MachineMaintDocument>,
    @InjectModel(MachineInstallation.name)
    private readonly installationModel: Model<MachineInstallationDocument>,
    @InjectModel(MachineProduction.name)
    private readonly productionModel: Model<MachineProductionDocument>,
  ) {}

  async create(dto: CreateMachineDeliveryDto): Promise<MachineDeliveryDocument> {
    const machineReceptionId = new Types.ObjectId(dto.machineReception);
    const reception = await this.receptionModel.findById(machineReceptionId).exec();
    if (!reception) throw new NotFoundException('Machine reception not found');

    if (reception.status === ReceptionStatus.DELIVERED) {
      throw new BadRequestException('Machine is already delivered');
    }

    const existingDelivery = await this.repo.findByMachineReception(machineReceptionId);
    if (existingDelivery) {
      throw new BadRequestException('Machine delivery already exists for this reception');
    }

    const taskResolution = await this.findReadyTaskForReception(machineReceptionId);
    if (taskResolution.hasTasks && !taskResolution.task) {
      throw new BadRequestException('Assigned task is not ready for delivery yet');
    }

    if (!taskResolution.hasTasks && reception.status !== ReceptionStatus.READY) {
      throw new BadRequestException('Machine is not ready for delivery yet');
    }

    const technicianFee = dto.technicianFee;
    const companyFee = dto.companyFee;
    if (!this.isNonNegativeNumber(technicianFee) || !this.isNonNegativeNumber(companyFee)) {
      throw new BadRequestException('Technician fee and company fee are required before delivery');
    }

    const inputReport = this.normalizeText(dto.technicianReport);
    const taskReport =
      taskResolution.task && taskResolution.task.type !== 'production'
        ? this.normalizeText((taskResolution.task.doc as any).technicianReport)
        : '';
    const receptionReport = this.normalizeText(reception.technicianReport);
    const finalReport = inputReport || taskReport || receptionReport;

    if (!finalReport) {
      throw new BadRequestException('Technician report is required before delivery');
    }

    if (taskResolution.task) {
      if (!this.isTaskReadyForDelivery(taskResolution.task) && this.isExternalTaskCandidate(taskResolution.task)) {
        this.markTaskReadyForDelivery(taskResolution.task);
      }

      (taskResolution.task.doc as any).technicianFee = technicianFee;
      (taskResolution.task.doc as any).companyFee = companyFee;

      if (taskResolution.task.type !== 'production' && inputReport) {
        (taskResolution.task.doc as any).technicianReport = inputReport;
      }

      await taskResolution.task.doc.save();
    }

    reception.technicianReport = finalReport;
    reception.technicianFee = technicianFee;
    reception.companyFee = companyFee;

    const created = await this.repo.create({
      machineReception: machineReceptionId,
      machineName: dto.machineName ?? '',
      machineDetails: dto.machineDetails ?? '',
      customerName: dto.customerName ?? '',
      deliveryDate: dto.deliveryDate ? new Date(dto.deliveryDate) : new Date(),
      notes: dto.notes ?? '',
      deliveredBy: dto.deliveredBy ? new Types.ObjectId(dto.deliveredBy) : undefined,
    });

    reception.status = ReceptionStatus.DELIVERED;
    await reception.save();

    return this.findById(created._id as Types.ObjectId);
  }

  async findAll(): Promise<MachineDeliveryDocument[]> { return this.repo.findAll(); }

  async findById(id: Types.ObjectId): Promise<MachineDeliveryDocument> {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Machine delivery not found');
    return doc;
  }

  async update(id: Types.ObjectId, dto: UpdateMachineDeliveryDto): Promise<MachineDeliveryDocument> {
    const data: Record<string, unknown> = { ...dto };
    if (dto.deliveredBy !== undefined) data.deliveredBy = dto.deliveredBy ? new Types.ObjectId(dto.deliveredBy) : undefined;
    if (dto.deliveryDate !== undefined) data.deliveryDate = dto.deliveryDate ? new Date(dto.deliveryDate) : new Date();
    const updated = await this.repo.updateById(id, data as any);
    if (!updated) throw new NotFoundException('Machine delivery not found');
    return updated;
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException('Machine delivery not found');

    const deleted = await this.repo.deleteById(id);
    if (!deleted) throw new NotFoundException('Machine delivery not found');

    const receptionId = this.extractObjectId(existing.machineReception);
    if (receptionId) {
      await this.receptionModel.findByIdAndUpdate(receptionId, { status: ReceptionStatus.READY }).exec();
    }
  }

  private async findReadyTaskForReception(machineReceptionId: Types.ObjectId): Promise<DeliveryTaskResolution> {
    const [inspection, maintenance, installation, production] = await Promise.all([
      this.inspectionModel.findOne({ machineReception: machineReceptionId }).sort({ updatedAt: -1 }).exec(),
      this.maintenanceModel.findOne({ machineReception: machineReceptionId }).sort({ updatedAt: -1 }).exec(),
      this.installationModel.findOne({ machineReception: machineReceptionId }).sort({ updatedAt: -1 }).exec(),
      this.productionModel.findOne({ machineReception: machineReceptionId }).sort({ updatedAt: -1 }).exec(),
    ]);

    const candidates: DeliveryTaskCandidate[] = [];
    if (inspection) candidates.push({ type: 'inspection', doc: inspection });
    if (maintenance) candidates.push({ type: 'maintenance', doc: maintenance });
    if (installation) candidates.push({ type: 'installation', doc: installation });
    if (production) candidates.push({ type: 'production', doc: production });

    if (candidates.length === 0) {
      return { task: null, hasTasks: false };
    }

    const readyCandidates = candidates.filter((candidate) => this.isTaskReadyForDelivery(candidate));
    if (readyCandidates.length > 0) {
      readyCandidates.sort(
        (a, b) =>
          this.getTaskTimeMs((b.doc as any).updatedAt ?? (b.doc as any).createdAt) -
          this.getTaskTimeMs((a.doc as any).updatedAt ?? (a.doc as any).createdAt),
      );

      return { task: readyCandidates[0] ?? null, hasTasks: true };
    }

    const externalCandidates = candidates.filter((candidate) => this.isExternalTaskCandidate(candidate));
    if (externalCandidates.length === 0) {
      return { task: null, hasTasks: true };
    }

    externalCandidates.sort(
      (a, b) =>
        this.getTaskTimeMs((b.doc as any).updatedAt ?? (b.doc as any).createdAt) -
        this.getTaskTimeMs((a.doc as any).updatedAt ?? (a.doc as any).createdAt),
    );

    return { task: externalCandidates[0] ?? null, hasTasks: true };
  }

  private isTaskReadyForDelivery(candidate: DeliveryTaskCandidate): boolean {
    const status = String((candidate.doc as any).status ?? '').toLowerCase();
    const readyFlag = Boolean((candidate.doc as any).readyForDelivery);

    if (candidate.type === 'installation') {
      return status === 'ready';
    }

    return readyFlag || status === 'ready';
  }

  private isExternalTaskCandidate(candidate: DeliveryTaskCandidate): boolean {
    const status = String((candidate.doc as any).status ?? '').toLowerCase();
    if (status === 'rejected') return false;

    const technicianName = this.normalizeText((candidate.doc as any).technicianName);
    if (!technicianName) return false;

    const technicianId = this.extractObjectId((candidate.doc as any).technician);
    return !technicianId;
  }

  private markTaskReadyForDelivery(candidate: DeliveryTaskCandidate): void {
    (candidate.doc as any).status = 'ready';

    if (candidate.type !== 'installation') {
      (candidate.doc as any).readyForDelivery = true;
    }
  }

  private normalizeText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private isNonNegativeNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0;
  }

  private getTaskTimeMs(value: unknown): number {
    if (!value) return 0;
    const time = new Date(value as any).getTime();
    return Number.isNaN(time) ? 0 : time;
  }

  private extractObjectId(value: unknown): Types.ObjectId | null {
    if (value instanceof Types.ObjectId) return value;

    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      return new Types.ObjectId(value);
    }

    if (value && typeof value === 'object' && '_id' in (value as Record<string, unknown>)) {
      const nestedId = (value as Record<string, unknown>)._id;

      if (nestedId instanceof Types.ObjectId) return nestedId;
      if (typeof nestedId === 'string' && Types.ObjectId.isValid(nestedId)) {
        return new Types.ObjectId(nestedId);
      }
    }

    return null;
  }
}

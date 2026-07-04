import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import {
  TechnicianTasksService,
  TaskType,
} from './technician-tasks.service.js';
import {
  MachineTaskReportDto,
  RejectionDto,
  PauseReasonDto,
} from '../common/dto/machine-task-report.dto.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';

interface AuthenticatedRequest {
  user: { _id: Types.ObjectId };
}

const VALID_TASK_TYPES: TaskType[] = [
  'inspection',
  'maintenance',
  'installation',
  'production',
];

function validateTaskType(type: string): TaskType {
  if (!VALID_TASK_TYPES.includes(type as TaskType)) {
    throw new BadRequestException(
      `Invalid task type: ${type}. Valid types: ${VALID_TASK_TYPES.join(', ')}`,
    );
  }
  return type as TaskType;
}

function parseObjectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new BadRequestException(`Invalid ObjectId: ${id}`);
  }
  return new Types.ObjectId(id);
}

@Controller('technician-tasks')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.TECHNICIAN)
export class TechnicianTasksController {
  constructor(private readonly service: TechnicianTasksService) {}

  @Get('my-tasks')
  async getMyTasks(@Req() req: AuthenticatedRequest) {
    return this.service.getAllTasksForTechnician(req.user._id);
  }

  @Get('my-tasks/active')
  async getMyActiveTasks(@Req() req: AuthenticatedRequest) {
    return this.service.getActiveTasksForTechnician(req.user._id);
  }

  @Patch(':type/:id/start')
  async startTask(
    @Param('type') type: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const taskType = validateTaskType(type);
    const taskId = parseObjectId(id);
    return this.service.startTask(taskType, taskId, req.user._id);
  }

  @Patch(':type/:id/pause')
  async pauseTask(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: PauseReasonDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const taskType = validateTaskType(type);
    const taskId = parseObjectId(id);
    return this.service.pauseTask(
      taskType,
      taskId,
      req.user._id,
      dto.reason ?? '',
    );
  }

  @Patch(':type/:id/resume')
  async resumeTask(
    @Param('type') type: string,
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const taskType = validateTaskType(type);
    const taskId = parseObjectId(id);
    return this.service.resumeTask(taskType, taskId, req.user._id);
  }

  @Patch(':type/:id/finish')
  async finishTask(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() report: MachineTaskReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const taskType = validateTaskType(type);
    const taskId = parseObjectId(id);
    return this.service.finishTask(taskType, taskId, req.user._id, report);
  }

  @Patch(':type/:id/reject')
  async rejectTask(
    @Param('type') type: string,
    @Param('id') id: string,
    @Body() dto: RejectionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const taskType = validateTaskType(type);
    const taskId = parseObjectId(id);
    return this.service.rejectTask(taskType, taskId, req.user._id, dto.reason);
  }
}

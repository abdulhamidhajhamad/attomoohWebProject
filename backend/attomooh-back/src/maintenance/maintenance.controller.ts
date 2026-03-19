import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { Request } from 'express';
import { MaintenanceService } from './maintenance.service.js';
import { EmployeesService } from '../employees/employees.service.js';
import {
  CreateTaskDto,
  AssignTaskDto,
  TaskReportDto,
  UpdateTaskDto,
} from './dto/index.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { TaskStatus } from '../common/enums/task-status.enum.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

/** Shape of req.user set by JwtStrategy.validate() */
interface AuthenticatedRequest extends Request {
  user: {
    _id: Types.ObjectId;
    email: string;
    role: string;
    name: string;
  };
}

@Controller('maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly employeesService: EmployeesService,
  ) {}

  /* ═══════════════════════════════════
     Admin Endpoints
     ═══════════════════════════════════ */

  /**
   * POST /maintenance/tasks
   * Create a new maintenance task — Admin only
   */
  @Post('tasks')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async createTask(
    @Body() dto: CreateTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.createTask(dto, req.user._id);
  }

  /**
   * GET /maintenance/tasks
   * Get all tasks — Admin only
   */
  @Get('tasks')
  @Roles(UserRole.ADMIN)
  async findAllTasks(@Query('status') status?: string) {
    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      return this.maintenanceService.findByStatus(status as TaskStatus);
    }
    return this.maintenanceService.findAll();
  }

  /**
   * GET /maintenance/stats
   * Get dashboard stats — Admin only
   */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.maintenanceService.getStats();
  }

  /**
   * GET /maintenance/technicians
   * Get all technicians with their status — Admin only
   */
  @Get('technicians')
  @Roles(UserRole.ADMIN)
  async getTechnicians() {
    return await this.employeesService.findTechnicians();
  }

  /**
   * GET /maintenance/tasks/calendar?from=YYYY-MM-DD&to=YYYY-MM-DD&technicianId=xxx
   * Get tasks for calendar view within a date range — Admin or Technician
   */
  @Get('tasks/calendar')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async getCalendarTasks(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('technicianId') technicianId?: string,
    @Req() req?: AuthenticatedRequest,
  ) {
    if (!from || !to) {
      throw new BadRequestException(
        'Query params "from" and "to" are required (YYYY-MM-DD)',
      );
    }
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      throw new BadRequestException('Invalid date format — use YYYY-MM-DD');
    }

    // If technician calls this, only return their own tasks
    const techId =
      req?.user.role === UserRole.TECHNICIAN
        ? req.user._id
        : technicianId
          ? new Types.ObjectId(technicianId)
          : undefined;

    return this.maintenanceService.findByDateRange(fromDate, toDate, techId);
  }

  /**
   * GET /maintenance/tasks/:id
   * Get a single task — Admin or assigned Technician
   */
  @Get('tasks/:id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async findOneTask(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.maintenanceService.findById(id);
  }

  /**
   * PATCH /maintenance/tasks/:id
   * Update task details — Admin only
   */
  @Patch('tasks/:id')
  @Roles(UserRole.ADMIN)
  async updateTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.maintenanceService.updateTask(id, dto);
  }

  /**
   * PATCH /maintenance/tasks/:id/assign
   * Assign task to a technician — Admin only
   */
  @Patch('tasks/:id/assign')
  @Roles(UserRole.ADMIN)
  async assignTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: AssignTaskDto,
  ) {
    return this.maintenanceService.assignTask(id, dto);
  }

  /**
   * PATCH /maintenance/tasks/:id/cancel
   * Cancel a task — Admin only
   */
  @Patch('tasks/:id/cancel')
  @Roles(UserRole.ADMIN)
  async cancelTask(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.maintenanceService.cancelTask(id);
  }

  /**
   * DELETE /maintenance/tasks/:id
   * Delete a task — Admin only
   */
  @Delete('tasks/:id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteTask(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.maintenanceService.deleteTask(id);
    return { message: 'Task deleted successfully' };
  }

  /* ═══════════════════════════════════
     Technician Endpoints
     ═══════════════════════════════════ */

  /**
   * GET /maintenance/my-status
   * Get the current technician's status
   */
  @Get('my-status')
  @Roles(UserRole.TECHNICIAN)
  async getMyStatus(@Req() req: AuthenticatedRequest) {
    const user = await this.employeesService.findById(req.user._id);
    return { technicianStatus: user.technicianStatus };
  }

  /**
   * PATCH /maintenance/my-status
   * Technician updates their own status (available / on_task / off_duty)
   */
  @Patch('my-status')
  @Roles(UserRole.TECHNICIAN)
  async updateMyStatus(
    @Req() req: AuthenticatedRequest,
    @Body('status') status: string,
  ) {
    if (!Object.values(TechnicianStatus).includes(status as TechnicianStatus)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${Object.values(TechnicianStatus).join(', ')}`,
      );
    }
    const user = await this.employeesService.updateTechnicianStatus(
      req.user._id,
      status as TechnicianStatus,
    );
    return { technicianStatus: user.technicianStatus };
  }

  /**
   * GET /maintenance/my-tasks
   * Get tasks assigned to the logged-in technician
   */
  @Get('my-tasks')
  @Roles(UserRole.TECHNICIAN)
  async getMyTasks(@Req() req: AuthenticatedRequest) {
    return this.maintenanceService.findByTechnician(req.user._id);
  }

  /**
   * GET /maintenance/my-tasks/active
   * Get active tasks for the logged-in technician
   */
  @Get('my-tasks/active')
  @Roles(UserRole.TECHNICIAN)
  async getMyActiveTasks(@Req() req: AuthenticatedRequest) {
    return this.maintenanceService.findActiveTasks(req.user._id);
  }

  /**
   * PATCH /maintenance/tasks/:id/start
   * Start working on a task — Technician only
   */
  @Patch('tasks/:id/start')
  @Roles(UserRole.TECHNICIAN)
  async startTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.startTask(id, req.user._id);
  }

  /**
   * PATCH /maintenance/tasks/:id/pause
   * Pause a task — Technician only
   */
  @Patch('tasks/:id/pause')
  @Roles(UserRole.TECHNICIAN)
  async pauseTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.pauseTask(id, req.user._id);
  }

  /**
   * PATCH /maintenance/tasks/:id/resume
   * Resume a paused task — Technician only
   */
  @Patch('tasks/:id/resume')
  @Roles(UserRole.TECHNICIAN)
  async resumeTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.resumeTask(id, req.user._id);
  }

  /**
   * PATCH /maintenance/tasks/:id/finish
   * Finish a task with report — Technician only
   */
  @Patch('tasks/:id/finish')
  @Roles(UserRole.TECHNICIAN)
  async finishTask(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() reportDto: TaskReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.maintenanceService.finishTask(id, req.user._id, reportDto);
  }
}

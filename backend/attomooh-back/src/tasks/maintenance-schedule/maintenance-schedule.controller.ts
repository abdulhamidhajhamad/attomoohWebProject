import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { Request } from 'express';
import { Req } from '@nestjs/common';
import { MaintenanceScheduleService } from './maintenance-schedule.service.js';
import {
  CreateMaintenanceScheduleDto,
  UpdateMaintenanceScheduleDto,
} from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/maintenance-schedule')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MaintenanceScheduleController {
  constructor(private readonly svc: MaintenanceScheduleService) {}

  private static parseDate(raw?: string): Date | null {
    if (!raw) return null;
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  @Post() @HttpCode(HttpStatus.CREATED) async create(
    @Body() dto: CreateMaintenanceScheduleDto,
  ) {
    return this.svc.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Req() req?: Request & { user?: { _id: Types.ObjectId; role: string } },
  ) {
    const fromDate = MaintenanceScheduleController.parseDate(from);
    const toDate = MaintenanceScheduleController.parseDate(to);

    if (req?.user?.role === UserRole.TECHNICIAN) {
      const rangeFrom = fromDate ?? new Date('1970-01-01');
      const rangeTo = toDate ?? new Date('2100-01-01');
      return this.svc.findForTechnicianByDateRange(
        req.user._id,
        rangeFrom,
        rangeTo,
      );
    }

    if (fromDate && toDate) return this.svc.findByDateRange(fromDate, toDate);
    return this.svc.findAll(search);
  }

  @Get(':id') async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return this.svc.findById(id);
  }
  @Patch(':id') async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateMaintenanceScheduleDto,
  ) {
    return this.svc.update(id, dto);
  }
  @Patch(':id/reschedule') async reschedule(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateMaintenanceScheduleDto,
  ) {
    return this.svc.reschedule(id, dto);
  }
  @Patch(':id/cancel') async cancel(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('reason') reason: string,
  ) {
    return this.svc.cancel(id, reason);
  }
  @Delete(':id') @HttpCode(HttpStatus.OK) async delete(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    await this.svc.delete(id);
    return { message: 'Maintenance schedule deleted' };
  }
}

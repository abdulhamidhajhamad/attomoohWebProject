import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { MaintenanceScheduleService } from './maintenance-schedule.service.js';
import { CreateMaintenanceScheduleDto, UpdateMaintenanceScheduleDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/maintenance-schedule')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MaintenanceScheduleController {
  constructor(private readonly svc: MaintenanceScheduleService) {}

  @Post() @HttpCode(HttpStatus.CREATED) async create(@Body() dto: CreateMaintenanceScheduleDto) { return this.svc.create(dto); }

  @Get() async findAll(@Query('from') from?: string, @Query('to') to?: string) {
    if (from && to) return this.svc.findByDateRange(new Date(from), new Date(to));
    return this.svc.findAll();
  }

  @Get(':id') async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateMaintenanceScheduleDto) { return this.svc.update(id, dto); }
  @Patch(':id/reschedule') async reschedule(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateMaintenanceScheduleDto) { return this.svc.reschedule(id, dto); }
  @Patch(':id/cancel') async cancel(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body('reason') reason: string) { return this.svc.cancel(id, reason); }
  @Delete(':id') @HttpCode(HttpStatus.OK) async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { await this.svc.delete(id); return { message: 'Maintenance schedule deleted' }; }
}

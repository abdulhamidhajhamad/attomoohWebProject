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
import { MachineMaintService } from './machine-maint.service.js';
import { CreateMachineMaintDto, UpdateMachineMaintDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/machine-maintenance')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MachineMaintController {
  constructor(private readonly svc: MachineMaintService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMachineMaintDto) {
    return this.svc.create(dto);
  }

  @Get()
  async findAll(@Query('status') status?: string, @Query('search') search?: string) {
    return this.svc.findAll(status, search);
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateMachineMaintDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/start')
  async startWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.startWork(id);
  }

  @Patch(':id/pause')
  async pauseWork(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body('reason') reason: string,
  ) {
    return this.svc.pauseWork(id, reason);
  }

  @Patch(':id/resume')
  async resumeWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.resumeWork(id);
  }

  @Patch(':id/finish')
  async finishWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.finishWork(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.svc.delete(id);
    return { message: 'Maintenance record deleted' };
  }
}

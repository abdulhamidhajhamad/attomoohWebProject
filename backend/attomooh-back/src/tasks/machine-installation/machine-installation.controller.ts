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
import { MachineInstallationService } from './machine-installation.service.js';
import {
  CreateMachineInstallationDto,
  UpdateMachineInstallationDto,
} from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/machine-installation')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MachineInstallationController {
  constructor(private readonly svc: MachineInstallationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMachineInstallationDto) {
    return this.svc.create(dto);
  }

  @Get()
  async findAll(@Query('status') status?: string) {
    return this.svc.findAll(status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateMachineInstallationDto,
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
    return { message: 'Installation record deleted' };
  }
}

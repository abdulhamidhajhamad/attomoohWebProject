import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { MachineReceptionService } from './machine-reception.service.js';
import { CreateMachineReceptionDto, UpdateMachineReceptionDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/machine-reception')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MachineReceptionController {
  constructor(private readonly svc: MachineReceptionService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMachineReceptionDto) { return this.svc.create(dto); }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('excludeAssigned') excludeAssigned?: string,
    @Query('includeExternalPending') includeExternalPending?: string,
  ) {
    const shouldExcludeAssigned = excludeAssigned === 'true' || excludeAssigned === '1';
    const shouldIncludeExternalPending = includeExternalPending === 'true' || includeExternalPending === '1';
    return this.svc.findAll(status, {
      excludeAssigned: shouldExcludeAssigned,
      includeExternalPending: shouldIncludeExternalPending,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateMachineReceptionDto) { return this.svc.update(id, dto); }

  @Patch(':id/start')
  async startWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.startWork(id); }

  @Patch(':id/pause')
  async pauseWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body('reason') reason: string) { return this.svc.pauseWork(id, reason); }

  @Patch(':id/resume')
  async resumeWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.resumeWork(id); }

  @Patch(':id/finish')
  async finishWork(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.finishWork(id); }

  @Delete(':id') @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { await this.svc.delete(id); return { message: 'Machine reception deleted successfully' }; }
}

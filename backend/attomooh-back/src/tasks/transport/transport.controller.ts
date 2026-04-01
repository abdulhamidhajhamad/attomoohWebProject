import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { TransportService } from './transport.service.js';
import { CreateTransportDto, UpdateTransportDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/transport')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class TransportController {
  constructor(private readonly svc: TransportService) {}
  @Post() @HttpCode(HttpStatus.CREATED) async create(@Body() dto: CreateTransportDto) { return this.svc.create(dto); }
  @Get() async findAll(@Query('search') search?: string) { return this.svc.findAll(search); }
  @Get(':id') async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findById(id); }
  @Patch(':id') async update(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateTransportDto) { return this.svc.update(id, dto); }
  @Patch(':id/start') async start(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.startWork(id); }
  @Patch(':id/pause') async pause(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body('reason') reason: string) { return this.svc.pauseWork(id, reason); }
  @Patch(':id/resume') async resume(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.resumeWork(id); }
  @Patch(':id/finish') async finish(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.finishWork(id); }
  @Delete(':id') @HttpCode(HttpStatus.OK) async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { await this.svc.delete(id); return { message: 'Transport deleted' }; }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { MachineTypesService } from './machine-types.service.js';
import { CreateMachineTypeDto, UpdateMachineTypeDto } from './dto/index.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

@Controller('machine-types')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class MachineTypesController {
  constructor(private readonly machineTypesService: MachineTypesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateMachineTypeDto) {
    return this.machineTypesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.machineTypesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.machineTypesService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateMachineTypeDto,
  ) {
    return this.machineTypesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.machineTypesService.delete(id);
    return { message: 'Machine type deleted successfully' };
  }
}

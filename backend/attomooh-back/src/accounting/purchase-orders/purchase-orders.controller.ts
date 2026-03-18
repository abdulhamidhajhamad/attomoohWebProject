import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { CreatePurchaseOrderDto, UpdatePurchaseOrderDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('accounting/purchase-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class PurchaseOrdersController {
  constructor(private readonly svc: PurchaseOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePurchaseOrderDto) {
    return this.svc.create(dto);
  }

  @Get()
  async findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Patch(':id/approve')
  async approve(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.svc.approve(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.svc.delete(id);
    return { message: 'Purchase order deleted successfully' };
  }
}

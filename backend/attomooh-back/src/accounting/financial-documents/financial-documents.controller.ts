import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { FinancialDocumentsService } from './financial-documents.service.js';
import { CreateFinancialDocumentDto, UpdateFinancialDocumentDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';
import { FinancialDocType } from '../../common/enums/financial-doc-type.enum.js';

@Controller('accounting/financial-documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class FinancialDocumentsController {
  constructor(private readonly svc: FinancialDocumentsService) {}

  @Post() @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateFinancialDocumentDto) { return this.svc.create(dto); }

  @Get()
  async findAll(@Query('type') type?: FinancialDocType) { return this.svc.findAll(type); }

  @Get('by-customer/:customerId')
  async findByCustomer(@Param('customerId', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findByCustomer(id); }

  @Get('by-supplier/:supplierId')
  async findBySupplier(@Param('supplierId', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findBySupplier(id); }

  @Get('by-technician/:technicianId')
  async findByTechnician(@Param('technicianId', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findByTechnician(id); }

  @Get(':id')
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { return this.svc.findById(id); }

  @Patch(':id')
  async update(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateFinancialDocumentDto) { return this.svc.update(id, dto); }

  @Delete(':id') @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) { await this.svc.delete(id); return { message: 'Financial document deleted' }; }
}

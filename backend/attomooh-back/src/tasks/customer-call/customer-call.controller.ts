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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { CustomerCallService } from './customer-call.service.js';
import { CreateCustomerCallDto, UpdateCustomerCallDto } from './dto/index.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe.js';

@Controller('tasks/customer-call')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
export class CustomerCallController {
  constructor(private readonly svc: CustomerCallService) {}
  @Post() @HttpCode(HttpStatus.CREATED) async create(
    @Body() dto: CreateCustomerCallDto,
  ) {
    return this.svc.create(dto);
  }
  @Get() async findAll(@Query('search') search?: string) {
    return this.svc.findAll(search);
  }
  @Get(':id') async findOne(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    return this.svc.findById(id);
  }
  @Patch(':id') async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateCustomerCallDto,
  ) {
    return this.svc.update(id, dto);
  }
  @Delete(':id') @HttpCode(HttpStatus.OK) async delete(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
  ) {
    await this.svc.delete(id);
    return { message: 'Customer call deleted' };
  }
}

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Types } from 'mongoose';
import { Request } from 'express';
import { ServiceOrdersService } from './service-orders.service.js';
import {
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  CompleteServiceOrderDto,
  AssignServiceOrderDto,
} from './dto/index.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe.js';

interface AuthenticatedRequest extends Request {
  user: { _id: Types.ObjectId; email: string; role: string; name: string };
}

@Controller('service-orders')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ServiceOrdersController {
  constructor(private readonly ordersService: ServiceOrdersService) {}

  /* ═══════════════════════════════════
     Admin — إدارة أوامر الخدمة
     ═══════════════════════════════════ */

  /** POST /service-orders — استلام آلة (إنشاء أمر خدمة) */
  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateServiceOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.createOrder(dto, req.user._id);
  }

  /** GET /service-orders — قائمة جميع الأوامر */
  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(@Query('status') status?: string) {
    return this.ordersService.findAll(status);
  }

  /** GET /service-orders/stats — إحصائيات */
  @Get('stats')
  @Roles(UserRole.ADMIN)
  async getStats() {
    return this.ordersService.getStats();
  }

  /** GET /service-orders/reports/by-machine-type */
  @Get('reports/by-machine-type')
  @Roles(UserRole.ADMIN)
  async reportByMachineType() {
    return this.ordersService.reportByMachineType();
  }

  /** GET /service-orders/reports/by-technician */
  @Get('reports/by-technician')
  @Roles(UserRole.ADMIN)
  async reportByTechnician() {
    return this.ordersService.reportByTechnician();
  }

  /** GET /service-orders/reports/by-customer */
  @Get('reports/by-customer')
  @Roles(UserRole.ADMIN)
  async reportByCustomer() {
    return this.ordersService.reportByCustomer();
  }

  /** GET /service-orders/my-orders — أوامر الفني */
  @Get('my-orders')
  @Roles(UserRole.TECHNICIAN)
  async getMyOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findByTechnician(req.user._id);
  }

  /** GET /service-orders/my-orders/active — أوامر نشطة */
  @Get('my-orders/active')
  @Roles(UserRole.TECHNICIAN)
  async getMyActiveOrders(@Req() req: AuthenticatedRequest) {
    return this.ordersService.findActiveByTechnician(req.user._id);
  }

  /** GET /service-orders/technician/:technicianId — أوامر فني محدد (للإدارة) */
  @Get('technician/:technicianId')
  @Roles(UserRole.ADMIN)
  async getByTechnician(
    @Param('technicianId', ParseObjectIdPipe) technicianId: Types.ObjectId,
  ) {
    return this.ordersService.findByTechnician(technicianId);
  }

  /** GET /service-orders/:id — تفاصيل أمر واحد */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TECHNICIAN)
  async findOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.ordersService.findById(id);
  }

  /** PATCH /service-orders/:id — تعديل */
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.ordersService.updateOrder(id, dto);
  }

  /** PATCH /service-orders/:id/assign — تعيين فني */
  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  async assign(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: AssignServiceOrderDto,
  ) {
    return this.ordersService.assignTechnician(id, dto);
  }

  /** PATCH /service-orders/:id/deliver — تسليم الآلة */
  @Patch(':id/deliver')
  @Roles(UserRole.ADMIN)
  async deliver(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.ordersService.deliverOrder(id);
  }

  /** DELETE /service-orders/:id */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    await this.ordersService.deleteOrder(id);
    return { message: 'Service order deleted successfully' };
  }

  /* ═══════════════════════════════════
     Technician — عمليات الفني
     ═══════════════════════════════════ */

  /** PATCH /service-orders/:id/start — بدء العمل */
  @Patch(':id/start')
  @Roles(UserRole.TECHNICIAN)
  async startWork(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.startWork(id, req.user._id);
  }

  /** PATCH /service-orders/:id/pause — إيقاف مؤقت */
  @Patch(':id/pause')
  @Roles(UserRole.TECHNICIAN)
  async pauseWork(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.pauseWork(id, req.user._id);
  }

  /** PATCH /service-orders/:id/resume — استئناف */
  @Patch(':id/resume')
  @Roles(UserRole.TECHNICIAN)
  async resumeWork(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.resumeWork(id, req.user._id);
  }

  /** PATCH /service-orders/:id/complete — إنهاء + تقرير */
  @Patch(':id/complete')
  @Roles(UserRole.TECHNICIAN)
  async completeOrder(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: CompleteServiceOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ordersService.completeOrder(id, req.user._id, dto);
  }
}

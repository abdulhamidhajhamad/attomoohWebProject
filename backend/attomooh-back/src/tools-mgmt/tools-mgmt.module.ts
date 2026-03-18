import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tool, ToolSchema } from './schemas/tool.schema.js';
import { ToolRepository } from './repositories/tool.repository.js';
import { ToolsMgmtService } from './tools-mgmt.service.js';
import { ToolsMgmtController } from './tools-mgmt.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Tool.name, schema: ToolSchema }])],
  controllers: [ToolsMgmtController],
  providers: [ToolsMgmtService, ToolRepository],
  exports: [ToolsMgmtService],
})
export class ToolsMgmtModule {}

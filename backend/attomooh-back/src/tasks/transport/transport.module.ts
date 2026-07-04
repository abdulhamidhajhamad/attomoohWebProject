import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Transport, TransportSchema } from './schemas/transport.schema.js';
import { TransportRepository } from './repositories/transport.repository.js';
import { TransportService } from './transport.service.js';
import { TransportController } from './transport.controller.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transport.name, schema: TransportSchema },
    ]),
  ],
  controllers: [TransportController],
  providers: [TransportService, TransportRepository],
  exports: [TransportService],
})
export class TransportModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinancialDocument, FinancialDocumentSchema } from './schemas/financial-document.schema.js';
import { FinancialDocumentRepository } from './repositories/financial-document.repository.js';
import { FinancialDocumentsService } from './financial-documents.service.js';
import { FinancialDocumentsController } from './financial-documents.controller.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: FinancialDocument.name, schema: FinancialDocumentSchema }])],
  controllers: [FinancialDocumentsController],
  providers: [FinancialDocumentsService, FinancialDocumentRepository],
  exports: [FinancialDocumentsService],
})
export class FinancialDocumentsModule {}

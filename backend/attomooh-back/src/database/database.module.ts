import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Employee, EmployeeSchema } from '../employees/schemas/employee.schema.js';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema.js';
import { DatabaseSeeder } from './seeders/database.seeder.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schemas/user.schema.js';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema.js';
import { DatabaseSeeder } from './seeders/database.seeder.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [DatabaseSeeder],
})
export class DatabaseModule {}

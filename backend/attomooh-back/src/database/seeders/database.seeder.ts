import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../user/schemas/user.schema.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import {
  Category,
  CategoryDocument,
} from '../../categories/schemas/category.schema.js';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdmin();
    await this.seedTechnicians();
    await this.seedRootCategories();
  }

  /* ── Admin Seed ── */

  private async seedAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@company.com',
    );
    const existingAdmin = await this.userModel.findOne({ email: adminEmail });

    if (existingAdmin) {
      this.logger.log('Admin user already exists, skipping seed');
      return;
    }

    const saltRounds = this.configService.get<number>(
      'BCRYPT_SALT_ROUNDS',
      10,
    );
    const adminPassword = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'Admin@123',
    );
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await this.userModel.create({
      name: this.configService.get<string>('ADMIN_NAME', 'Admin'),
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: this.configService.get<string>('ADMIN_PHONE', '05484584'),
    });

    this.logger.log('Admin user seeded successfully');
  }

  /* ── Technicians Seed ── */

  private async seedTechnicians(): Promise<void> {
    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );

    const technicians = [
      {
        name: 'abo hane',
        email: 'abohane@company.com',
        password: 'Tech@123',
        phone: '0500000001',
      },
      {
        name: 'abdalwahab',
        email: 'abdalwahab@company.com',
        password: 'Tech@123',
        phone: '0500000002',
      },
    ];

    for (const tech of technicians) {
      const exists = await this.userModel.findOne({ email: tech.email });
      if (exists) {
        this.logger.log(`Technician "${tech.name}" already exists, skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(tech.password, saltRounds);
      await this.userModel.create({
        name: tech.name,
        email: tech.email,
        password: hashedPassword,
        role: UserRole.TECHNICIAN,
        phone: tech.phone,
      });
      this.logger.log(`Technician "${tech.name}" seeded successfully`);
    }
  }

  /* ── Root Categories Seed ── */

  private async seedRootCategories(): Promise<void> {
    const roots = [
      {
        name: { ar: 'معدات مطاعم', en: 'Restaurant Equipment' },
        description: { ar: 'تجهيزات ومعدات المطاعم والمطابخ الصناعية', en: 'Restaurant and industrial kitchen equipment and supplies' },
        icon: 'chef-hat',
      },
      {
        name: { ar: 'معدات ملاحم', en: 'Butchery Equipment' },
        description: { ar: 'تجهيزات ومعدات الملاحم ومحلات اللحوم', en: 'Butchery and meat shop equipment and supplies' },
        icon: 'beef',
      },
    ];

    for (const root of roots) {
      const exists = await this.categoryModel.findOne({ 'name.ar': root.name.ar });
      if (exists) continue;

      await this.categoryModel.create({
        name: root.name,
        description: root.description,
        icon: root.icon,
        parents: [],
        level: 0,
        isActive: true,
      });
      this.logger.log(`Root category "${root.name.ar}" seeded`);
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  Employee,
  EmployeeDocument,
} from '../../employees/schemas/employee.schema.js';
import { UserRole } from '../../common/enums/user-role.enum.js';
import {
  Category,
  CategoryDocument,
} from '../../categories/schemas/category.schema.js';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSeeder.name);

  constructor(
    @InjectModel(Employee.name)
    private readonly employeeModel: Model<EmployeeDocument>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedAdmin();
    await this.seedTechnicians();
    await this.seedRootCategories();
  }

  /**
   * Resolves a seed password from env vars.
   * In non-development environments a missing password is fatal:
   * seeding must never silently fall back to a known default.
   * In development only, a fallback is kept but a loud warning is logged.
   */
  private resolveSeedPassword(envVar: string, devFallback: string): string {
    const password = this.configService.get<string>(envVar);
    if (password) return password;

    if (process.env.NODE_ENV !== 'development') {
      throw new Error(
        `${envVar} env var is required in ${process.env.NODE_ENV ?? 'production'} environment. ` +
          'Refusing to seed with a default password.',
      );
    }

    this.logger.warn(
      `⚠️  WARNING: ${envVar} is not set. Using a development-only fallback password. ` +
        `Set ${envVar} in .env before deploying to production!`,
    );
    return devFallback;
  }

  /* ── Admin Seed ── */

  private async seedAdmin(): Promise<void> {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@company.com',
    );
    const existingAdmin = await this.employeeModel.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      this.logger.log('Admin employee already exists, skipping seed');
      return;
    }

    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );
    const adminPassword = this.resolveSeedPassword('ADMIN_PASSWORD', 'Admin@123');
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await this.employeeModel.create({
      customId: 'EMP-000001',
      name: this.configService.get<string>('ADMIN_NAME', 'Admin'),
      email: adminEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: this.configService.get<string>('ADMIN_PHONE', '05484584'),
      jobTitle: 'System Administrator',
      isActive: true,
    });

    this.logger.log('Admin employee seeded successfully');
  }

  /* ── Technicians Seed ── */

  private async seedTechnicians(): Promise<void> {
    const saltRounds = Number(
      this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10),
    );

    const defaultTechPassword = this.resolveSeedPassword(
      'TECH_PASSWORD',
      'Tech@123',
    );

    const technicians = [
      {
        customId: 'EMP-000002',
        name: 'abo hane',
        email: 'abohane@company.com',
        password: defaultTechPassword,
        phone: '0500000001',
        jobTitle: 'Technician',
      },
      {
        customId: 'EMP-000003',
        name: 'abdalwahab',
        email: 'abdalwahab@company.com',
        password: defaultTechPassword,
        phone: '0500000002',
        jobTitle: 'Technician',
      },
    ];

    for (const tech of technicians) {
      const exists = await this.employeeModel.findOne({ email: tech.email });
      if (exists) {
        this.logger.log(`Technician "${tech.name}" already exists, skipping`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(tech.password, saltRounds);
      await this.employeeModel.create({
        customId: tech.customId,
        name: tech.name,
        email: tech.email,
        password: hashedPassword,
        role: UserRole.TECHNICIAN,
        phone: tech.phone,
        jobTitle: tech.jobTitle,
        isActive: true,
      });
      this.logger.log(`Technician "${tech.name}" seeded successfully`);
    }
  }

  /* ── Root Categories Seed ── */

  private async seedRootCategories(): Promise<void> {
    const roots = [
      {
        name: { ar: 'معدات مطاعم', en: 'Restaurant Equipment' },
        description: {
          ar: 'تجهيزات ومعدات المطاعم والمطابخ الصناعية',
          en: 'Restaurant and industrial kitchen equipment and supplies',
        },
        icon: 'chef-hat',
      },
      {
        name: { ar: 'معدات ملاحم', en: 'Butchery Equipment' },
        description: {
          ar: 'تجهيزات ومعدات الملاحم ومحلات اللحوم',
          en: 'Butchery and meat shop equipment and supplies',
        },
        icon: 'beef',
      },
    ];

    for (const root of roots) {
      const exists = await this.categoryModel.findOne({
        'name.ar': root.name.ar,
      });
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

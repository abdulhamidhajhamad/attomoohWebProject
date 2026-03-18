import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './repositories/user.repository.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserDocument } from './schemas/user.schema.js';
import { TechnicianStatus } from '../common/enums/technician-status.enum.js';

@Injectable()
export class UserService {
  private readonly SALT_ROUNDS: number;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
  ) {
    this.SALT_ROUNDS = Number(this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10));
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.userRepository.existsByEmail(createUserDto.email);

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.SALT_ROUNDS,
    );

    return this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });
  }

  async findById(id: Types.ObjectId): Promise<UserDocument> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userRepository.findByEmail(email);
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userRepository.findAll();
  }

  async delete(id: Types.ObjectId): Promise<void> {
    const deleted = await this.userRepository.deleteById(id);
    if (!deleted) throw new NotFoundException('User not found');
  }

  /** Get all technicians */
  async findTechnicians(): Promise<UserDocument[]> {
    return this.userRepository.findTechnicians();
  }

  /** Update a technician's work status */
  async updateTechnicianStatus(
    id: Types.ObjectId,
    status: TechnicianStatus,
  ): Promise<UserDocument> {
    const user = await this.userRepository.updateTechnicianStatus(id, status);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

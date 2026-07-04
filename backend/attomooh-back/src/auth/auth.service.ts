import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { EmployeesService } from '../employees/employees.service.js';
import { CreateEmployeeDto } from '../employees/dto/create-employee.dto.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { LoginDto } from './dto/login.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { JwtPayload } from './interfaces/jwt-payload.interface.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly employeesService: EmployeesService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<{ accessToken: string }> {
    const createDto: CreateEmployeeDto = {
      name: signupDto.name,
      email: signupDto.email,
      password: signupDto.password,
      phone: signupDto.phone,
      role: UserRole.USER,
    };
    const employee = await this.employeesService.create(createDto);

    const payload: JwtPayload = {
      sub: employee._id.toString(),
      email: employee.email!,
      role: employee.role!,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const employee = await this.employeesService.findByEmail(loginDto.email);

    if (!employee || !employee.password || !employee.role) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      employee.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: employee._id.toString(),
      email: employee.email!,
      role: employee.role,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }
}

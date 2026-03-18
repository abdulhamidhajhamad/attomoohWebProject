import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EmployeesService } from '../../employees/employees.service.js';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly employeesService: EmployeesService,
  ) {
    const secret = configService.get<string>('JWT_SECRET')!;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const employee = await this.employeesService.findById(
      new Types.ObjectId(payload.sub),
    );

    if (!employee) {
      throw new UnauthorizedException('User not found');
    }

    return {
      _id: employee._id,
      email: employee.email,
      role: employee.role,
      name: employee.name,
    };
  }
}

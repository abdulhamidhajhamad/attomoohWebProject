import { IsMongoId } from 'class-validator';

export class AssignServiceOrderDto {
  @IsMongoId()
  technicianId: string;
}

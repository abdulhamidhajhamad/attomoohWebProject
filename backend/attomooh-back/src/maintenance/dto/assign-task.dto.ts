import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignTaskDto {
  @IsMongoId()
  @IsNotEmpty()
  technicianId: string;
}

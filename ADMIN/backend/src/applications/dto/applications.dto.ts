import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class FilterApplicationsDto {
  @IsOptional()
  @IsString()
  role_id?: string;

  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ReviewApplicationDto {
  @IsEnum(ApplicationStatus)
  status!: ApplicationStatus;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}

import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class SubscribeApplicationDto {
  @IsUUID()
  applicationId!: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;
}


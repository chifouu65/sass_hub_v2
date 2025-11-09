import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class SubscribeApplicationDto {
  @IsUUID()
  applicationId: string;

  @IsOptional()
  @IsISO8601({}, { message: 'startsAt must be an ISO-8601 string', each: false })
  startsAt?: string | null;

  @IsOptional()
  @IsISO8601({}, { message: 'endsAt must be an ISO-8601 string', each: false })
  endsAt?: string | null;
}


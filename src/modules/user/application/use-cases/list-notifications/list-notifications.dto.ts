import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  take?: number = 10;
}

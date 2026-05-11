import { IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class CreateGroupPurchaseDto {
  @IsUUID()
  productId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0.01)
  originalPrice: number;

  @IsNumber()
  @Min(0.01)
  targetPrice: number;

  @IsNumber()
  @Min(2)
  minimumParticipants: number;

  @IsNumber()
  @Min(1)
  durationMinutes: number;
}

import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class VoidTicketHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(255)
  reason!: string;
}

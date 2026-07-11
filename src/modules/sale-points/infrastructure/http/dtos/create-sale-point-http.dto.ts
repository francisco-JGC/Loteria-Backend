import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateSalePointHttpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'code must contain only letters, digits and dashes',
  })
  code!: string;

  @IsUUID()
  ownerId!: string;
}

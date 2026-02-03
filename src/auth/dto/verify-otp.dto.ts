import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({
    example: '442',
    description: "ID de l'utilisateur",
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: '123456',
    description: 'Code de vérification à 6 chiffres',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

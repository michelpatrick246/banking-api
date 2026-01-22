import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: "Adresse email unique de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'John',
    description: "Prénom de l'utilisateur",
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: "Nom de famille de l'utilisateur",
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Mot de passe (minimum 4 caractères)',
    minLength: 4,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Mot de passe ne peut pas être vide' })
  password: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class PasswordDto {
    @ApiProperty()
    @IsString()
    password: string;
}

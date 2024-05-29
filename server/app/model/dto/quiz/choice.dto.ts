import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ChoiceDto {
    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsBoolean()
    isCorrect: boolean;
}

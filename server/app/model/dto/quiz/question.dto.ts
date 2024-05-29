import { QTypes } from '@common/question-type';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChoiceDto } from './choice.dto';

export class QuestionsDto {
    @ApiProperty()
    @IsEnum(QTypes)
    type: QTypes;

    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsNumber()
    points: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => ChoiceDto)
    choices?: ChoiceDto[];
}

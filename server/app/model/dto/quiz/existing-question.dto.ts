import { QTypes } from '@common/question-type';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ChoiceDto } from './choice.dto';
import { Type } from 'class-transformer';

export class ExistingQuestionsDto {
    @ApiProperty()
    @IsString()
    id: string;

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
    @IsString()
    suggestedAnswer?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => ChoiceDto)
    choices?: ChoiceDto[];

    @ApiProperty()
    @IsString()
    lastModif: string;
}

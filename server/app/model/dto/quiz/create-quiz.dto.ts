import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { QuestionsDto } from './question.dto';
import { Type } from 'class-transformer';

export class CreateQuizDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    duration: number;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    visibility: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    lastModification?: string;

    @ApiProperty()
    @ValidateNested()
    @IsNotEmpty()
    @Type(() => QuestionsDto)
    questions: QuestionsDto[];

    @ApiProperty()
    @IsString()
    @IsOptional()
    id: string;
}

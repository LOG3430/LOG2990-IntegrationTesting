import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ExistingQuestionsDto } from './existing-question.dto';
import { Type } from 'class-transformer';

export class ModifyQuizDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    @IsBoolean()
    visibility: boolean;

    @ApiProperty()
    @ValidateNested()
    @Type(() => ExistingQuestionsDto)
    questions: ExistingQuestionsDto[];

    @ApiProperty()
    @IsString()
    @IsOptional()
    lastModification?: string;
}

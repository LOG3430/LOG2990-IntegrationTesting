import { QuizService } from '@app/services/quiz/quiz.service';
import { Quiz } from '@common/quiz';
import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('quiz')
export class QuizController {
    constructor(private readonly quizService: QuizService) {}

    @Get(':id')
    async findOne(@Param('id') id: string, @Res() res: Response) {
        const quiz = await this.quizService.findOne(id);
        if (quiz === null) {
            res.status(HttpStatus.NOT_FOUND).send();
        } else {
            res.status(HttpStatus.OK).json(quiz);
        }
    }

    @Get()
    async findAll(): Promise<Quiz[]> {
        return this.quizService.findAll();
    }
}

import { QuestionsDto } from '@app/model/dto/quiz/question.dto';
import { QuestionService } from '@app/services/question/question.service';
import { QuizConverter } from '@app/services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { Question } from '@common/question';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('question')
export class QuestionController {
    constructor(
        private readonly questionService: QuestionService,
        private readonly quizConverter: QuizConverter,
        private readonly qValidator: QuizValidatorService,
    ) {}

    @Get()
    async findAll(): Promise<Question[]> {
        return this.questionService.findAll();
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Res() res: Response) {
        const question = await this.questionService.findOne(id);
        if (question) {
            res.status(HttpStatus.OK).json(question);
        } else {
            res.status(HttpStatus.NOT_FOUND).send();
        }
    }

    @Post()
    async add(@Body() question: QuestionsDto, @Res() res: Response) {
        const questionAdded = this.quizConverter.convertQuestion(question);

        if (this.qValidator.validateQuestion(questionAdded)) {
            res.status(await this.questionService.create(questionAdded)).send(questionAdded);
        } else {
            res.status(HttpStatus.BAD_REQUEST).send();
        }
    }

    @Delete(':id')
    async remove(@Param('id') id: string, @Res() res: Response) {
        res.status(await this.questionService.remove(id)).send();
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() replacement: QuestionsDto, @Res() res: Response) {
        const newQuestion = this.quizConverter.convertQuestion(replacement);

        if (this.qValidator.validateQuestion(newQuestion)) {
            res.status(await this.questionService.update(id, newQuestion)).send(newQuestion);
        } else {
            res.status(HttpStatus.BAD_REQUEST).send();
        }
    }
}

import { PasswordDto } from '@app/model/dto/admin/password-dto';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { ModifyQuizDto } from '@app/model/dto/quiz/modify-quiz.dto';
import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Post, Put, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import 'dotenv/config';
import { Request, Response } from 'express';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
    constructor(
        private readonly quizService: QuizService,
        private readonly authentication: AuthenticationService,
    ) {}

    @Post('/verify')
    async verifyPassword(@Body() password: PasswordDto, @Res() response: Response) {
        const token = this.authentication.login(password.password);
        response.status(token ? HttpStatus.OK : HttpStatus.UNAUTHORIZED).send(token);
    }

    @Get('/verify')
    async isLoggedAsAdmin(@Req() request: Request, @Res() response: Response) {
        response.status(this.isLogged(request) ? HttpStatus.OK : HttpStatus.UNAUTHORIZED).send();
    }

    @Post('/quiz')
    async createQuiz(@Body() quiz: CreateQuizDto, @Res() response: Response) {
        response.status(await this.quizService.create(quiz)).send();
    }

    @Put('/quiz')
    async modifyQuiz(@Body() updatedInfo: ModifyQuizDto, @Res() response: Response) {
        response.status(await this.quizService.update(updatedInfo)).send();
    }

    @Delete('/quiz/:id')
    async remove(@Param('id') id: string, @Res() res: Response) {
        if (await this.quizService.removeOne(id)) {
            res.status(HttpStatus.NO_CONTENT).send();
        } else {
            res.status(HttpStatus.NOT_FOUND).send();
        }
    }

    @Delete('/quiz')
    async removeAll(@Res() res: Response) {
        await this.quizService.removeAll();
        return res.status(HttpStatus.NO_CONTENT).send();
    }

    private isLogged(request: Request): boolean {
        return this.authentication.isLoggedIn(this.readAuthHeader(request));
    }

    private readAuthHeader(request: Request): string {
        const auth = request.headers.authorization;
        return auth ? auth.split(' ')[1] : '';
    }
}

import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { QuizService } from '@app/services/quiz/quiz.service';
import { expectHttpResponse } from '@app/utils/expect-http-response';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { AdminController } from './admin.controller';
import { Request } from 'express';
import { AuthenticationService } from '@app/services/authentication/authentication.service';
import { ModifyQuizDto } from '@app/model/dto/quiz/modify-quiz.dto';

const quizzes: CreateQuizDto[] = [{ id: 0 } as unknown as CreateQuizDto, { id: 1 } as unknown as CreateQuizDto];

describe('AdminController', () => {
    let controller: AdminController;
    let service: SinonStubbedInstance<QuizService>;
    let auth: SinonStubbedInstance<AuthenticationService>;

    beforeEach(async () => {
        service = createStubInstance(QuizService);
        auth = createStubInstance(AuthenticationService);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AdminController],
            providers: [
                { provide: QuizService, useValue: service },
                { provide: AuthenticationService, useValue: auth },
            ],
        }).compile();

        controller = module.get<AdminController>(AdminController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('Password verification', () => {
        const token = 'token';

        it('Good password should return OK', async () => {
            const res = expectHttpResponse(HttpStatus.OK);
            auth.login.returns(token);
            await controller.verifyPassword({ password: `${process.env.ADMIN_PASSWORD}` }, res);
            expect(auth.login.calledOnceWith(process.env.ADMIN_PASSWORD)).toBeTruthy();
        });

        it('Wrong password should return UNAUTHORIZED', async () => {
            const res = expectHttpResponse(HttpStatus.UNAUTHORIZED);
            auth.login.returns(null);
            await controller.verifyPassword({ password: 'password123' }, res);
            expect(auth.login.calledOnceWith('password123')).toBeTruthy();
        });

        const getRequest = (authToken: string): Request => {
            return { headers: { authorization: `Bearer ${authToken}` } } as Request;
        };

        it('should recognize connexion with correct token', async () => {
            const res = expectHttpResponse(HttpStatus.OK);
            auth.isLoggedIn.returns(true);
            await controller.isLoggedAsAdmin(getRequest(token), res);
            expect(auth.isLoggedIn.calledOnceWith(token)).toBeTruthy();
        });

        it('should deny connexion if bad token', async () => {
            const res = expectHttpResponse(HttpStatus.UNAUTHORIZED);
            auth.isLoggedIn.returns(false);
            await controller.isLoggedAsAdmin(getRequest(''), res);
            expect(auth.isLoggedIn.calledOnceWith('')).toBeTruthy();
        });

        it('should not fail if request has no authorization header', async () => {
            const res = expectHttpResponse(HttpStatus.UNAUTHORIZED);
            auth.isLoggedIn.returns(false);
            await controller.isLoggedAsAdmin({ headers: {} } as Request, res);
            expect(auth.isLoggedIn.calledOnceWith('')).toBeTruthy();
        });
    });

    describe('POST quiz', () => {
        it('should ask the service to create and return whatever it says', async () => {
            [HttpStatus.I_AM_A_TEAPOT, HttpStatus.OK].forEach((status) => {
                service.create.resolves(status);
                const res = expectHttpResponse(status);
                controller.createQuiz(quizzes[0], res);
                expect(service.create.calledOnceWith(quizzes[0]));
                service.create.resetHistory();
            });
        });
    });

    describe('Delete quiz', () => {
        it('delete() should be able to delete an existing game', async () => {
            service.removeOne.resolves(true);

            const res = expectHttpResponse(HttpStatus.NO_CONTENT);
            await controller.remove(quizzes[0].id + '', res);

            expect(service.removeOne.calledOnceWith(quizzes[0].id));
        });

        it('delete() should fail to delete a non existing game', async () => {
            service.removeOne.resolves(false);

            const res = expectHttpResponse(HttpStatus.NOT_FOUND);
            await controller.remove(quizzes[0].id + '', res);

            expect(service.removeOne.calledOnceWith(quizzes[0].id));
        });

        it('delete all quiz should return NO_CONTENT', async () => {
            service.removeAll.resolves(null);
            const res = expectHttpResponse(HttpStatus.NO_CONTENT);
            controller.removeAll(res);
        });
    });

    describe('PUT quiz', () => {
        it('should ask the service to update and return whatever it says', async () => {
            [HttpStatus.I_AM_A_TEAPOT, HttpStatus.OK].forEach((status) => {
                service.update.resolves(status);
                const res = expectHttpResponse(status);
                controller.modifyQuiz(quizzes[0] as ModifyQuizDto, res);
                expect(service.update.calledOnceWith(quizzes[0]));
                service.update.resetHistory();
            });
        });
    });
});

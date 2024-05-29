import { QuizService } from '@app/services/quiz/quiz.service';
import { expectHttpResponse } from '@app/utils/expect-http-response';
import { Quiz } from '@common/quiz';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { QuizController } from './quiz.controller';

const quizzes: Quiz[] = [{ id: 0 } as unknown as Quiz, { id: 1 } as unknown as Quiz];

describe('QuizController', () => {
    let controller: QuizController;
    let service: SinonStubbedInstance<QuizService>;

    beforeEach(async () => {
        service = createStubInstance(QuizService);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuizController],
            providers: [{ provide: QuizService, useValue: service }],
        }).compile();

        controller = module.get<QuizController>(QuizController);
    });

    describe('init', () => {
        it('should be defined', () => {
            expect(controller).toBeDefined();
        });
    });

    describe('GET', () => {
        it('findAll() should return all games', async () => {
            service.findAll.resolves(quizzes);
            expect(await controller.findAll()).toEqual(quizzes);
            expect(service.findAll.calledOnce).toBeTruthy();
        });

        it('findOne(id) should return the game if found', async () => {
            service.findOne.resolves(quizzes[0]);

            const res = expectHttpResponse(HttpStatus.OK, quizzes[0]);
            await controller.findOne(quizzes[0].id + '', res);

            expect(service.findOne.calledOnceWith(quizzes[0].id));
        });

        it('findOne(id) should have status not found if service returns null', async () => {
            service.findOne.resolves(null);

            const res = expectHttpResponse(HttpStatus.NOT_FOUND);
            await controller.findOne(quizzes[0].id + '', res);

            expect(service.findOne.calledOnceWith(quizzes[0].id));
        });
    });
});

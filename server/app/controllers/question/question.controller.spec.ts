import { QuestionsDto } from '@app/model/dto/quiz/question.dto';
import { QuestionService } from '@app/services/question/question.service';
import { QuizConverter } from '@app/services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { expectHttpResponse } from '@app/utils/expect-http-response';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { QuestionController } from './question.controller';

const longAnswer = 'Ben voyons';

const shortAnswer: Choice[] = [
    { text: 'a', isCorrect: true },
    { text: 'b', isCorrect: false },
];

const shortQuestion: Question = {
    id: '0',
    answer: shortAnswer,
    type: QTypes.MCQ,
    points: 10,
} as unknown as Question;

const longQuestion: Question = {
    id: '1',
    answer: longAnswer,
    type: QTypes.LAQ,
    points: 30,
} as unknown as Question;

const questions: Question[] = [shortQuestion, longQuestion];

describe('QuestionController', () => {
    let controller: QuestionController;
    let service: SinonStubbedInstance<QuestionService>;
    let qValidator: SinonStubbedInstance<QuizValidatorService>;
    let qConverter: SinonStubbedInstance<QuizConverter>;

    beforeEach(async () => {
        service = createStubInstance(QuestionService);
        qValidator = createStubInstance(QuizValidatorService);
        qConverter = createStubInstance(QuizConverter);

        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionController],
            providers: [
                {
                    provide: QuestionService,
                    useValue: service,
                },
                {
                    provide: QuizValidatorService,
                    useValue: qValidator,
                },
                {
                    provide: QuizConverter,
                    useValue: qConverter,
                },
            ],
        }).compile();

        controller = module.get<QuestionController>(QuestionController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('GETs', () => {
        it('findAll() should return all questions', async () => {
            service.findAll.resolves(questions);
            expect(await controller.findAll()).toEqual(questions);
            expect(service.findAll.calledOnce).toBeTruthy();
        });

        it('findOne(id) should return the question if found', async () => {
            service.findOne.resolves(questions[0]);

            const res = expectHttpResponse(HttpStatus.OK, questions[0]);
            await controller.findOne(questions[0].id + '', res);

            expect(service.findOne.calledOnceWith(questions[0].id));
        });

        it('findOne(id) should have status not found if service returns null', async () => {
            service.findOne.resolves(null);

            const res = expectHttpResponse(HttpStatus.NOT_FOUND);
            await controller.findOne(questions[0].id + '', res);

            expect(service.findOne.calledOnceWith(questions[0].id));
        });
    });

    describe('POST', () => {
        it('Should return CREATED when question is valid', async () => {
            service.create.resolves(HttpStatus.CREATED);
            qValidator.validateQuestion.returns(true);

            const res = expectHttpResponse(HttpStatus.CREATED);
            await controller.add(questions[0], res);

            expect(service.create.calledOnceWith(questions[0]));
        });

        it('Should return BAD_REQUEST when question is invalid', async () => {
            service.create.resolves(HttpStatus.CREATED);
            qValidator.validateQuestion.returns(false);

            const res = expectHttpResponse(HttpStatus.BAD_REQUEST);
            await controller.add(questions[0], res);
        });

        it('Should return CONFLICT when question already exists', async () => {
            service.create.resolves(HttpStatus.CONFLICT);
            qValidator.validateQuestion.returns(true);

            const res = expectHttpResponse(HttpStatus.CONFLICT);
            await controller.add(questions[0], res);
        });

        it('Should return INTERNAL_SERVER_ERROR when cant insert question', async () => {
            service.create.resolves(HttpStatus.INTERNAL_SERVER_ERROR);
            qValidator.validateQuestion.returns(true);

            const res = expectHttpResponse(HttpStatus.INTERNAL_SERVER_ERROR);
            await controller.add(questions[0], res);
        });
    });
    describe('DELETE', () => {
        it('delete() should be able to delete an existing question', async () => {
            service.remove.resolves(HttpStatus.OK);

            const res = expectHttpResponse(HttpStatus.OK);
            await controller.remove(questions[0].id + '', res);

            expect(service.remove.calledOnceWith(questions[0].id));
        });

        it('delete() should fail to delete a non existing question', async () => {
            service.remove.resolves(HttpStatus.NOT_FOUND);

            const res = expectHttpResponse(HttpStatus.NOT_FOUND);
            await controller.remove(questions[0].id + '', res);
            expect(service.remove.calledOnceWith(questions[0].id));
        });
    });
    describe('PUTs', () => {
        const questionDto: QuestionsDto = {
            type: QTypes.LAQ,
            text: 'Change answer of long answer',
            points: 20,
        };
        it('Should return new question and OK if successful', async () => {
            qValidator.validateQuestion.returns(true);

            const res = expectHttpResponse(HttpStatus.OK);

            service.update.resolves(HttpStatus.OK);
            await controller.update(longQuestion.id, questionDto, res);

            expect(service.update.calledOnce).toBeTruthy();
        });

        it('Should return BAD_REQUEST if invalid question', async () => {
            qValidator.validateQuestion.returns(false);

            const res = expectHttpResponse(HttpStatus.BAD_REQUEST);
            await controller.update('2', questionDto, res);
            expect(service.update.notCalled).toBeTruthy();
        });
    });
});

import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { Quiz } from '@common/quiz';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QuizService } from './quiz.service';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { QuizConverter } from '@app/services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { HttpStatus } from '@nestjs/common';
import { UpdateResult } from 'mongodb';
import { ModifyQuizDto } from '@app/model/dto/quiz/modify-quiz.dto';

const quizzes: Quiz[] = [{ id: 0, duration: 10 } as unknown as Quiz, { id: 1, duration: 20 } as unknown as Quiz];

describe('QuizService', () => {
    let service: QuizService;
    let mongoServer: MongoMemoryServer;
    let mongoService: MongoDbService;
    let quizConverter: SinonStubbedInstance<QuizConverter>;
    let quizValidator: SinonStubbedInstance<QuizValidatorService>;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        quizConverter = createStubInstance(QuizConverter);
        quizValidator = createStubInstance(QuizValidatorService);

        quizConverter.createNewQuiz.callsFake((x) => x as Quiz);
        quizValidator.validateQuiz.returns(true);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizService,
                {
                    provide: MongoDbService,
                    useFactory: async () => {
                        return MongoDbService.mongoDbFactory(mongoServer.getUri(), 'quiz-db');
                    },
                },
                { provide: QuizConverter, useValue: quizConverter },
                { provide: QuizValidatorService, useValue: quizValidator },
            ],
        }).compile();

        mongoService = module.get<MongoDbService>(MongoDbService);
        service = module.get<QuizService>(QuizService);
    });

    afterEach(async () => {
        await mongoService.disconnect();
        if (mongoServer) {
            await mongoServer.stop();
        }
    });

    describe('init', () => {
        it('should be defined', () => {
            expect(service).toBeDefined();
        });

        it('should be empty on itialisation', async () => {
            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('create', () => {
        it('should create a quiz when it is valid', async () => {
            quizValidator.validateQuiz.returns(true);
            expect(await service.create(quizzes[0])).toBe(HttpStatus.CREATED);
        });

        it('should return BAD_REQUEST when creating an invalid quiz', async () => {
            quizValidator.validateQuiz.returns(false);
            expect(await service.create(quizzes[0])).toBe(HttpStatus.BAD_REQUEST);
        });

        it('should return INTERNAL_SERVER_ERROR if mongo fails', async () => {
            quizValidator.validateQuiz.returns(true);
            jest.spyOn(service['quizzes'], 'updateOne').mockResolvedValue({ upsertedCount: 0 } as UpdateResult<Quiz>);
            expect(await service.create(quizzes[0])).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe('update', () => {
        let updateDto: ModifyQuizDto;

        beforeEach(async () => {
            await service.create(quizzes[0]);
            updateDto = { id: quizzes[0].id, duration: quizzes[1].duration } as ModifyQuizDto;
            quizConverter.updatedQuiz.returns(updateDto as Quiz);
        });

        it('should update a quiz when it is valid', async () => {
            quizValidator.validateQuiz.returns(true);
            expect(await service.update(updateDto)).toBe(HttpStatus.OK);
            expect((await service.findOne(updateDto.id)).duration).toBe(updateDto.duration);
        });

        it('should return OK when updating a non existing quiz (insert instead)', async () => {
            await service.removeOne(quizzes[0].id);
            quizValidator.validateQuiz.returns(true);
            expect(await service.update(updateDto)).toBe(HttpStatus.OK);
        });

        it('should return BAD_REQUEST when updating makes the quiz invalid', async () => {
            quizValidator.validateQuiz.returns(false);
            expect(await service.update(updateDto)).toBe(HttpStatus.BAD_REQUEST);
        });

        it('should return INTERNAL_SERVER_ERROR if mongo fails', async () => {
            quizValidator.validateQuiz.returns(true);
            jest.spyOn(service['quizzes'], 'updateOne').mockResolvedValue({ modifiedCount: 0 } as UpdateResult<Quiz>);
            expect(await service.update(updateDto)).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe('remove', () => {
        it('shoud be able to remove a quiz that exists', async () => {
            expect(await service.create(quizzes[0])).toBeTruthy();
            expect(await service.create(quizzes[1])).toBeTruthy();
            expect(await service.removeOne(quizzes[0].id)).toBeTruthy();
            expect(await service.findAll()).toEqual([quizzes[1]]);
        });

        it('should fail to remove a quiz that does not exist', async () => {
            expect(await service.removeOne(quizzes[0].id)).toBeFalsy();
        });

        it('should be able to remove all', async () => {
            expect(await service.create(quizzes[0])).toBeTruthy();
            expect(await service.create(quizzes[1])).toBeTruthy();
            await service.removeAll();
            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('find', () => {
        it('should be able to find a quiz that exists', async () => {
            expect(await service.create(quizzes[0])).toBeTruthy();
            expect(await service.findOne(quizzes[0].id)).toEqual(quizzes[0]);
        });

        it("should not find a quiz that doesn't exists", async () => {
            expect(await service.findOne(quizzes[0].id)).toEqual(null);
        });
    });
});

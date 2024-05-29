import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UpdateResult } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { QuestionService } from './question.service';

const longAnswer = 'Ben voyons';

const shortAnswer: Choice[] = [
    { text: 'a', isCorrect: true },
    { text: 'b', isCorrect: false },
];

const shortQuestion: Question = {
    id: '2',
    text: 'short Q',
    choices: shortAnswer,
    type: QTypes.MCQ,
    points: 10,
} as unknown as Question;

const longQuestion: Question = {
    id: '1',
    text: 'long Q',
    suggestedAnswer: longAnswer,
    type: QTypes.LAQ,
    points: 20,
} as unknown as Question;

const questions: Question[] = [shortQuestion, longQuestion];

describe('QuestionService', () => {
    let service: QuestionService;
    let mongoServer: MongoMemoryServer;
    let mongoService: MongoDbService;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionService,
                {
                    provide: MongoDbService,
                    useFactory: async () => {
                        return MongoDbService.mongoDbFactory(mongoServer.getUri(), 'question-db');
                    },
                },
            ],
        }).compile();

        mongoService = module.get<MongoDbService>(MongoDbService);
        service = module.get<QuestionService>(QuestionService);
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

        it('should be empty on initialisation', async () => {
            expect(await service.findAll()).toEqual([]);
        });
    });

    describe('add', () => {
        it('should be able to add a new question', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);
            expect((await service.findOne(questions[0].id)).lastModif).toBeTruthy();
            expect(await service.findAll()).toEqual([questions[0]]);
        });

        it('should be able to add a new LAQ question', async () => {
            expect(await service.create(questions[1])).toBe(HttpStatus.CREATED);
            expect((await service.findOne(questions[1].id)).lastModif).toBeTruthy();
            expect(await service.findAll()).toEqual([questions[1]]);
        });

        it('should not be able to add a question with another one that has the same text', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);
            expect(await service.create({ ...questions[1], text: questions[0].text })).toBe(HttpStatus.CONFLICT);
        });

        it('should return conflict if question already exists', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);

            expect(await service.create({ ...questions[1], id: questions[0].id })).toBe(HttpStatus.CONFLICT);
        });

        it('should return internal server error if mongo failed to update', async () => {
            jest.spyOn(service['questions'], 'updateOne').mockImplementation(async () => {
                return { modifiedCount: 0, upsertedCount: 0 } as unknown as UpdateResult<Question>;
            });

            expect(await service.create(questions[0])).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    describe('delete', () => {
        it('shoud be able to delete a question that exists', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);
            expect(await service.create(questions[1])).toBe(HttpStatus.CREATED);
            expect(await service.remove(questions[0].id)).toBeTruthy();
            expect(await service.findAll()).toEqual([questions[1]]);
        });

        it('should fail to delete a question that does not exist', async () => {
            expect(await service.remove(questions[0].id)).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('find', () => {
        it('should be able to find an existing question', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);
            expect(await service.findOne(questions[0].id)).toEqual(questions[0]);
        });

        it("should not find a question that doesn't exists", async () => {
            expect(await service.findOne(questions[0].id)).toEqual(null);
        });
    });

    describe('modify', () => {
        it('should be able to modify an existing question', async () => {
            expect(await service.create(shortQuestion)).toBe(HttpStatus.CREATED);

            const boolResult = await service.update(shortQuestion.id, longQuestion);
            expect(boolResult).toBeTruthy();

            const updatedQuestion = await service.findOne(shortQuestion.id);
            expect(updatedQuestion.lastModif).toBeTruthy();
            expect(updatedQuestion.text).toEqual(longQuestion.text);
        });

        it('should be able to modify a non-existing question', async () => {
            const boolResult = await service.update(shortQuestion.id, shortQuestion);
            expect(boolResult).toBeTruthy();
        });

        it('should not allow updating a question to have the same text as another one', async () => {
            expect(await service.create(questions[0])).toBe(HttpStatus.CREATED);
            expect(await service.create(questions[1])).toBe(HttpStatus.CREATED);

            const question = { ...questions[1] };
            question.text = questions[0].text;
            expect(await service.update(questions[1].id, question)).toBe(HttpStatus.CONFLICT);
        });

        it('should return internal server error if mongo failed to update', async () => {
            jest.spyOn(service['questions'], 'updateOne').mockImplementation(async () => {
                return { modifiedCount: 0, upsertedCount: 0 } as unknown as UpdateResult<Question>;
            });

            expect(await service.update('', questions[0])).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });

    it('countDocuments should return amount of documents in collection', async () => {
        await service.create(shortQuestion);
        await service.create(longQuestion);
        expect(await service.countDocuments(QTypes.MCQ)).toEqual(1);
    });

    it('findMultiple should return some documents in DB', async () => {
        expect(await service.findMultiple(1, QTypes.MCQ)).toEqual([]);
    });
});

import { AppModule } from '@app/app.module';
import { QuizConverter } from '@app/services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { QuizService } from '@app/services/quiz/quiz.service';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import * as request from 'supertest';

describe('AppController (e2e)', () => {
    let app: INestApplication;
    let service: SinonStubbedInstance<QuizService>;
    let quizConverter: SinonStubbedInstance<QuizConverter>;
    let quizValidator: SinonStubbedInstance<QuizValidatorService>;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    // Making sure our server starts well and we are able to get the date
    it('GET /date', async () => {
        return request(app.getHttpServer()).get('/date').expect(HttpStatus.OK);
    });

    beforeEach(async () => {
        quizConverter = createStubInstance(QuizConverter);
        service = createStubInstance(QuizService);
        quizValidator = createStubInstance(QuizValidatorService);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: QuizService,
                    useValue: service,
                },
                {
                    provide: QuizConverter,
                    useValue: quizConverter,
                },
                {
                    provide: QuizValidatorService,
                    useValue: quizValidator,
                },
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    it('should be defined', () => {
        expect(app).toBeDefined();
    });

    describe('Password verification', () => {
        it(`Good password should return 200`, () => {
            request(app.getHttpServer())
                .post('/admin/verify')
                .send({ password: `${process.env.ADMIN_PASSWORD}` })
                .expect(HttpStatus.OK);
        });
        it(`Wrong password should return 401`, () => {
            request(app.getHttpServer()).post('/admin/verify').send({ password: 'Word password' }).expect(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Quiz creation', () => {
        it('Valid quiz should return 201', () => {
            quizValidator.validateQuiz.resolves(true);
            service.createQuiz.resolves(true);
            quizConverter.createNewQuiz.resolves({});
            request(app.getHttpServer()).post('/admin/quiz').send({}).expect(HttpStatus.CREATED);
        });

        it('Invalid quiz should return 201', () => {
            quizValidator.validateQuiz.resolves(false);
            quizConverter.createNewQuiz.resolves({});
            request(app.getHttpServer()).post('/admin/quiz').send({}).expect(HttpStatus.BAD_REQUEST);
        });

        it('Failing to send quiz should return 400', () => {
            quizValidator.validateQuiz.resolves(true);
            quizConverter.createNewQuiz.resolves({});
            service.createQuiz.resolves(false);
            request(app.getHttpServer()).post('/admin/quiz').send({}).expect(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
});

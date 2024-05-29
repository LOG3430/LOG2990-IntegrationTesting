import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { QuestionsDto } from '@app/model/dto/quiz/question.dto';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizConverter } from './quiz-converter.service';

jest.mock('uuid', () => ({
    v4: jest.fn(() => 'mock-uuid-v4'),
}));

describe('QuizConverter', () => {
    jest.useFakeTimers();

    let service: QuizConverter;

    let quiz: CreateQuizDto;
    let mcq: QuestionsDto;
    let laqwithAnswer: QuestionsDto;
    let laqNoAnswer: QuestionsDto;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [QuizConverter],
        }).compile();

        service = module.get<QuizConverter>(QuizConverter);

        quiz = {
            title: 'Sample Quiz Title',
            description: 'This is a sample description for the quiz.',
            duration: 30,
            visibility: true,
            questions: [
                {
                    type: QTypes.MCQ,
                    text: 'question 1',
                    points: 50,
                    choices: [
                        { text: 'Choix 1', isCorrect: false },
                        { text: 'Choix 2', isCorrect: true },
                    ],
                },
                {
                    type: QTypes.MCQ,
                    text: 'question 2',
                    points: 30,
                },
            ],
            id: 'quiz_123',
        };

        mcq = {
            text: 'Une question',
            points: 40,
            choices: [
                {
                    text: 'foo',
                    isCorrect: true,
                },
                {
                    text: 'bar',
                    isCorrect: false,
                },
            ],
            type: QTypes.MCQ,
        };

        laqwithAnswer = {
            text: 'Yes',
            points: 40,
            type: QTypes.LAQ,
        };

        laqNoAnswer = {
            text: 'Yes',
            points: 40,
            type: QTypes.LAQ,
        };
    });

    it('Should be defined', () => {
        expect(service).toBeDefined();
    });

    it('Id should be generated', () => {
        delete quiz.id;
        expect(quiz.id).not.toBeDefined();
        expect(service.createNewQuiz(quiz).id).toBeDefined();
    });

    it('Id should be overwritten', () => {
        expect(service.createNewQuiz(quiz).id).toEqual('mock-uuid-v4');
    });

    it('id should be generated', () => {
        delete quiz.id;
        expect(service.createNewQuiz(quiz).id).toEqual('mock-uuid-v4');
    });

    it('Question id should be generated', () => {
        expect(service.createNewQuiz(quiz).questions[0].id).toBeDefined();
    });

    it('Quiz created should have all proprieties', () => {
        const attributes = ['id', 'title', 'description', 'duration', 'lastModification', 'questions', 'visibility'];
        for (const attribute of attributes) {
            expect(service.createNewQuiz(quiz)[attribute]).toBeDefined();
        }
    });

    it('Converted MCQ should have all attributes but suggestedAnswer', () => {
        const attributes = ['id', 'text', 'points', 'lastModif', 'type', 'choices'];
        const mcqObject: Question = service.convertQuestion(mcq);
        for (const attribute of attributes) {
            expect(mcqObject[attribute]).toBeDefined();
        }
        expect(mcqObject.type).toEqual(QTypes.MCQ);
    });

    it('Converted LAQ with answer should have all attributes but choices', () => {
        const attributes = ['id', 'text', 'points', 'lastModif', 'type'];
        const laqObject = service.convertQuestion(laqwithAnswer);
        for (const attribute of attributes) {
            expect(laqObject[attribute]).toBeDefined();
        }
        expect(laqObject.choices).toBeUndefined();
        expect(laqObject.type).toEqual(QTypes.LAQ);
    });

    it('Converted LAQ with no answer should have all attributes and no choices nor choices', () => {
        const attributes = ['id', 'text', 'points', 'lastModif', 'type'];
        const laqObject = service.convertQuestion(laqNoAnswer);
        for (const attribute of attributes) {
            expect(laqObject[attribute]).toBeDefined();
        }
        expect(laqObject.choices).toBeUndefined();
        expect(laqObject.type).toEqual(QTypes.LAQ);
    });

    it('MCQ with no type attribute should get MCQ type', () => {
        delete mcq.type;
        const attributes = ['id', 'text', 'points', 'lastModif', 'type', 'choices'];
        const mcqObject: Question = service.convertQuestion(mcq);
        for (const attribute of attributes) {
            expect(mcqObject[attribute]).toBeDefined();
        }
        expect(mcqObject.type).toEqual(QTypes.MCQ);
    });

    it('LAQ with no type attribute should get LAQ type', () => {
        delete laqwithAnswer.type;
        const attributes = ['id', 'text', 'points', 'lastModif', 'type'];
        const laqObject: Question = service.convertQuestion(laqwithAnswer);
        for (const attribute of attributes) {
            expect(laqObject[attribute]).toBeDefined();
        }
        expect(laqObject.choices).toBeUndefined();
        expect(laqObject.type).toEqual(QTypes.LAQ);
    });

    it('Modifying quiz should update the date and preserve attributes', () => {
        const quiz1 = service.createNewQuiz(quiz);
        delete quiz1.lastModification;
        quiz1.visibility = true;
        const quiz2 = service.updatedQuiz(quiz1);
        expect(quiz2.lastModification).toBeDefined();
        expect(quiz2.visibility).toBe(true);
        expect(quiz2.questions).toEqual(quiz1.questions);
    });
});

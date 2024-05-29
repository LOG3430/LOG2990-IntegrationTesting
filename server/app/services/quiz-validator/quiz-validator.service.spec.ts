import { QuizConstants } from '@common/constants';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizValidatorService } from './quiz-validator.service';

const randmonString = (length) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
};

describe('QuizValidatorService', () => {
    let service: QuizValidatorService;
    let validQuiz: Quiz;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [QuizValidatorService],
        }).compile();

        service = module.get<QuizValidatorService>(QuizValidatorService);

        validQuiz = {
            id: '1',
            title: 'Sample Quiz',
            description: 'A valid quiz description',
            duration: 30,
            lastModification: new Date().toUTCString(),
            questions: [
                {
                    id: 'q1',
                    type: QTypes.MCQ,
                    text: 'Sample Question',
                    points: 10,
                    choices: [
                        { text: 'Choix 1', isCorrect: false },
                        { text: 'Choix 2', isCorrect: true },
                    ],
                    lastModif: new Date().toUTCString(),
                },
            ],
            visibility: true,
        };
    });

    it('Should be defined', () => {
        expect(service).toBeDefined();
    });

    it('Valid quiz with MCQ should return true', () => {
        expect(service.validateQuiz(validQuiz)).toBeTruthy();
    });

    it('Quiz missing attribute(s) should return false', () => {
        const attributes = ['id', 'title', 'description', 'duration', 'lastModification', 'questions', 'visibility'];
        let tempQuiz = structuredClone(validQuiz);
        for (const attribute of attributes) {
            delete tempQuiz[attribute];
            expect(service.validateQuiz(tempQuiz)).toBeFalsy();
            tempQuiz = structuredClone(validQuiz);
        }
    });

    describe('Length of title should stay between bonds', () => {
        it('Quiz with title of length 0 should return false', () => {
            validQuiz.title = '';
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });

        it('Quiz with title of length bigger than max should return false', () => {
            validQuiz.title = randmonString(QuizConstants.TITLE_MAX_LENGTH + 1);
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });
    });

    describe('Quiz duration should be multiple of ten between 0 and 10', () => {
        it('Quiz with negative duration should return false', () => {
            validQuiz.duration = -10;
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });

        it('Quiz with duration bigger than 60 should return false', () => {
            validQuiz.duration = 70;
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });

        it('Quiz with non round duration should return false', () => {
            validQuiz.duration = 6;
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });
    });

    describe('MCQs choices must have at least 1 true and 1 false', () => {
        it('MCQ with all true choices should return false', () => {
            validQuiz.questions[0].choices = [
                { text: 'Choix 1', isCorrect: true },
                { text: 'Choix 2', isCorrect: true },
            ];
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });

        it('MCQ with all false choices should return false', () => {
            validQuiz.questions[0].choices = [
                { text: 'Choix 1', isCorrect: false },
                { text: 'Choix 2', isCorrect: false },
            ];
            expect(service.validateQuiz(validQuiz)).toBeFalsy();
        });
    });

    it('LAQ with choices should return false', () => {
        validQuiz.questions = [
            {
                id: 'q1',
                type: QTypes.LAQ,
                text: 'Sample Question',
                points: 10,
                choices: [
                    { text: 'Choix 1', isCorrect: false },
                    { text: 'Choix 2', isCorrect: true },
                ],
                lastModif: new Date().toUTCString(),
            },
        ];
        expect(service.validateQuiz(validQuiz)).toBeFalsy();
    });

    it('Question with negative points should return false', () => {
        validQuiz.questions[0].points = -10;
        expect(service.validateQuiz(validQuiz)).toBeFalsy();
    });

    it('Question with points bigger than 100 should return false', () => {
        validQuiz.questions[0].points = 110;
        expect(service.validateQuiz(validQuiz)).toBeFalsy();
    });

    it('Question with non round points should return false', () => {
        validQuiz.questions[0].points = 11;
        expect(service.validateQuiz(validQuiz)).toBeFalsy();
    });
});

import { SCORE_BONUS } from '@common/constants';
import { QuestionResults } from '@common/events';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Verificator } from './verificator';

interface TestCase {
    description: string;

    question: Question;
    answer: number[];
    isFirstToAnswer: boolean;

    expectedResult: QuestionResults;
}

const minimalQuestion = (choices: boolean[], points: number): Question => {
    return {
        points,
        type: QTypes.MCQ,
        choices: choices.map((c, i) => {
            return { isCorrect: c, text: i + '' };
        }),
    } as unknown as Question;
};

const POINTS = 10;
const TEST_CASES: TestCase[] = [
    {
        description: 'No wrong answer nor missing answer',
        question: minimalQuestion([], POINTS),
        answer: [],
        isFirstToAnswer: false,

        expectedResult: { points: POINTS, hasBonus: false, goodAnswers: [] },
    },
    {
        description: 'No wrong answer nor missing answer, with bonus',
        question: minimalQuestion([], POINTS),
        answer: [],
        isFirstToAnswer: true,

        expectedResult: { points: POINTS * SCORE_BONUS, hasBonus: true, goodAnswers: [] },
    },

    {
        description: 'correct answer, without bonus',
        question: minimalQuestion([true], POINTS),
        answer: [0],
        isFirstToAnswer: false,

        expectedResult: { points: POINTS, hasBonus: false, goodAnswers: ['0'] },
    },
    {
        description: 'correct answer, with bonus',
        question: minimalQuestion([true], POINTS),
        answer: [0],
        isFirstToAnswer: true,

        expectedResult: { points: POINTS * SCORE_BONUS, hasBonus: true, goodAnswers: ['0'] },
    },
    {
        description: 'missing answer',
        question: minimalQuestion([true], POINTS),
        answer: [],
        isFirstToAnswer: false,

        expectedResult: { points: 0, hasBonus: false, goodAnswers: ['0'] },
    },
    {
        description: 'missing answer does not get a bonus',
        question: minimalQuestion([true], POINTS),
        answer: [],
        isFirstToAnswer: true,

        expectedResult: { points: 0, hasBonus: false, goodAnswers: ['0'] },
    },
    {
        description: 'too many answers does not get a bonus',
        question: minimalQuestion([false], POINTS),
        answer: [0],
        isFirstToAnswer: true,

        expectedResult: { points: 0, hasBonus: false, goodAnswers: [] },
    },

    {
        description: 'identify every result',
        question: minimalQuestion([true, true, false, false], POINTS),
        answer: [0, 2],
        isFirstToAnswer: true,

        expectedResult: {
            points: 0,
            hasBonus: false,
            goodAnswers: ['0', '1'],
        },
    },

    {
        description: 'realistic correct case',
        question: minimalQuestion([true, true, false, false], POINTS),
        answer: [0, 1],
        isFirstToAnswer: true,

        expectedResult: {
            points: POINTS * SCORE_BONUS,
            hasBonus: true,
            goodAnswers: ['0', '1'],
        },
    },
];

describe('Verificator', () => {
    it('should be defined', () => {
        expect(new Verificator()).toBeDefined();
    });

    for (const testCase of TEST_CASES) {
        it(testCase.description, () => {
            expect(Verificator.verifyMCQ(testCase.question, testCase.answer, testCase.isFirstToAnswer)).toEqual(testCase.expectedResult);
        });
    }

    it('should verify laq', () => {
        const expectedResults = { points: 5, hasBonus: false };
        const grade = 50;
        const question: Question = {
            id: '1',
            lastModif: '12-01-2020',
            type: QTypes.LAQ,
            text: 'question',
            points: POINTS,
        };
        expect(Verificator.verifyLAQ(question, grade)).toEqual(expectedResults);
    });
});

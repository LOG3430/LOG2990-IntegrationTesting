import { QTypes } from '@common/question-type';
import { validate } from 'class-validator';
import { ChoiceDto } from './choice.dto';
import { CreateQuizDto } from './create-quiz.dto';
import { ModifyQuizDto } from './modify-quiz.dto';
import { QuestionsDto } from './question.dto';
import { ExistingQuestionsDto } from './existing-question.dto';

interface TestCase<T> {
    description: string;
    obj: T;
    expected: boolean;
}

const test = <T>(testcases: TestCase<T>[]) => {
    testcases.forEach((t) => {
        it(t.description, async () => {
            if (t.expected) {
                expect(await validate(t.obj as object)).toEqual([]);
            } else {
                expect(await validate(t.obj as object)).not.toEqual([]);
            }
        });
    });
};

describe('DTO', () => {
    const choiceCases: TestCase<ChoiceDto>[] = [
        {
            description: 'should allow correct dto',
            obj: {
                text: 'blabla',
                isCorrect: true,
            },
            expected: true,
        },
    ];
    describe('Choice', () => {
        test(choiceCases);
    });

    const questionCases: TestCase<QuestionsDto>[] = [
        {
            description: 'should allow correct dto',
            obj: {
                text: 'blabla',
                type: QTypes.MCQ,
                points: 10,
                choices: [choiceCases[0].obj],
            },
            expected: true,
        },
    ];

    describe('Question', () => {
        test(questionCases);
    });

    const existingQuestionCases: TestCase<ExistingQuestionsDto>[] = [
        {
            description: 'should allow correct dto',
            obj: {
                id: 'abc',
                text: 'blabla',
                type: QTypes.MCQ,
                points: 10,
                choices: [choiceCases[0].obj],
                lastModif: new Date().toUTCString(),
            },
            expected: true,
        },
    ];

    describe('Modify Question', () => {
        test(existingQuestionCases);
    });

    describe('Quiz', () => {
        const createQuizCases: TestCase<CreateQuizDto>[] = [
            {
                description: 'should allow correct dto',
                obj: {
                    title: 'blabla',
                    description: 'some game',
                    duration: 10,
                    visibility: true,
                    questions: [questionCases[0].obj],
                } as CreateQuizDto,
                expected: true,
            },
        ];

        describe('Create', () => {
            test(createQuizCases);
        });

        describe('Modify', () => {
            const testCases: TestCase<ModifyQuizDto>[] = [
                {
                    description: 'should allow correct dto',
                    obj: {
                        ...createQuizCases[0].obj,
                        id: 'abc',
                    } as ModifyQuizDto,
                    expected: true,
                },
            ];

            test(testCases);
        });
    });
});

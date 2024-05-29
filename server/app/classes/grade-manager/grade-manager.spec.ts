import { Grade, GradeCategory } from '@common/events';
import { GradeManager } from './grade-manager';

describe('GradeManager', () => {
    let gradeManager: GradeManager;

    beforeEach(() => {
        gradeManager = new GradeManager();
    });

    it('should be defined', () => {
        expect(gradeManager).toBeDefined();
    });

    it('should push grades', () => {
        const grades: Grade[] = [{ username: 'allo', grade: 50 }];
        gradeManager.grade(grades);
        gradeManager.pushGrades();
        expect(gradeManager.getGradeCountsList()).toStrictEqual([
            {
                [GradeCategory.Zero]: 0,
                [GradeCategory.Fifty]: 1,
                [GradeCategory.Hundred]: 0,
            },
        ]);
    });

    it('should push null', () => {
        gradeManager.pushGrades();
        expect(gradeManager.getGradeCountsList()).toStrictEqual([
            {
                [GradeCategory.Zero]: 0,
                [GradeCategory.Fifty]: 0,
                [GradeCategory.Hundred]: 0,
            },
        ]);
    });

    it('should reset on start round counts', () => {
        gradeManager['gradeCounts'] = {
            [GradeCategory.Zero]: 0,
            [GradeCategory.Fifty]: 1,
            [GradeCategory.Hundred]: 0,
        };
        gradeManager['grades'] = [{} as Grade];

        gradeManager.startRound();
        expect(gradeManager.getGradeCounts()).toStrictEqual({
            [GradeCategory.Zero]: 0,
            [GradeCategory.Fifty]: 0,
            [GradeCategory.Hundred]: 0,
        });
        expect(gradeManager.isGraded()).toBe(false);
        expect(gradeManager.getGrades()).toEqual([]);
    });

    it('should setWithGradesFromOrganiser', () => {
        gradeManager['gradeCountsList'] = [];
        gradeManager['grades'] = [];
        const gradesFromOrganiser = [
            { username: 'popo', grade: 100 },
            { username: 'bobo', grade: 50 },
        ];
        gradeManager.grade(gradesFromOrganiser);
        expect(gradeManager['grades']).toStrictEqual([
            { username: 'popo', grade: 100 },
            { username: 'bobo', grade: 50 },
        ]);

        gradeManager.pushGrades();
        expect(gradeManager.getGradeCountsList()).toStrictEqual([
            {
                [GradeCategory.Zero]: 0,
                [GradeCategory.Fifty]: 1,
                [GradeCategory.Hundred]: 1,
            },
        ]);
    });

    it('should getGrades', () => {
        gradeManager.grade([
            { username: 'popo', grade: 100 },
            { username: 'bobo', grade: 50 },
        ]);

        expect(gradeManager.getGrades()).toStrictEqual([
            { username: 'popo', grade: 100 },
            { username: 'bobo', grade: 50 },
        ]);
    });
});

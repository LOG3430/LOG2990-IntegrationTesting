import { Grade, GradeCategory, GradeCount } from '@common/events';

export class GradeManager {
    private grades: Grade[] = null;
    private gradeCounts: GradeCount;
    private gradeCountsList: GradeCount[] = [];

    constructor() {
        this.emptyCounts();
    }

    pushGrades(): GradeCount[] {
        this.getGrades().forEach((g) => (this.gradeCounts[g.grade] += 1));
        this.gradeCountsList.push(this.gradeCounts);
        return this.gradeCountsList;
    }

    grade(grades: Grade[]) {
        this.grades = grades;
    }

    startRound() {
        this.grades = null;
        this.emptyCounts();
    }

    isGraded(): boolean {
        return !!this.grades;
    }

    getGradeCountsList() {
        return this.gradeCountsList;
    }

    getGrades(): Grade[] {
        return this.grades ?? [];
    }

    getGradeCounts() {
        return this.gradeCounts;
    }

    private emptyCounts() {
        this.gradeCounts = {
            [GradeCategory.Zero]: 0,
            [GradeCategory.Fifty]: 0,
            [GradeCategory.Hundred]: 0,
        };
    }
}

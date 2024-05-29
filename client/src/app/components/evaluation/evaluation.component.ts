import { Component, OnInit } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { StatsService } from '@app/services/stats/stats.service';
import { Grade, UserAnswer } from '@common/events';

@Component({
    selector: 'app-evaluation',
    templateUrl: './evaluation.component.html',
    styleUrls: ['./evaluation.component.scss'],
})
export class EvaluationComponent implements OnInit {
    selectedGrade: number | null;
    private answersList: UserAnswer[] = [];
    private grades: Grade[] = [];
    private answerIndex: number = 0;

    constructor(
        private statsService: StatsService,
        private gameService: GameService,
        private organiserService: OrganiserService,
    ) {}

    ngOnInit(): void {
        this.initSortedAnswers();
    }

    isGraded(): boolean {
        return this.grades.length === this.answerIndex + 1;
    }

    goToNextAnswer(): void {
        if (!this.isGraded()) return;

        if (this.grades.length < this.answersList.length) {
            this.answerIndex++;
            this.selectedGrade = null;
        } else {
            this.organiserService.sendGrades(this.grades);
        }
    }

    getQuestionName(): string {
        return this.statsService.questionName;
    }

    getAnswersToEvaluate(): UserAnswer[] {
        return this.answersList;
    }

    getCurrentUsername(): string {
        return this.answersList[this.answerIndex].username;
    }

    getCurrentAnswer(): string {
        return this.answersList[this.answerIndex].answers;
    }

    chooseGrade(chosenGrade: number): void {
        if (this.isGraded()) this.grades.pop();
        this.grades.push({ username: this.getCurrentUsername(), grade: chosenGrade });
        this.selectedGrade = chosenGrade;
    }

    private initSortedAnswers(): void {
        this.answersList = this.gameService.getAnswersToEvaluate().sort((a, b) => a.username.localeCompare(b.username));
    }
}

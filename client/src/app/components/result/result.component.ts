import { Component } from '@angular/core';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { StatsService } from '@app/services/stats/stats.service';
import { Swipe } from '@common/constants';
import { ChoiceVote, GameResults } from '@common/events';

@Component({
    selector: 'app-result',
    templateUrl: './result.component.html',
    styleUrls: ['./result.component.scss'],
})
export class ResultComponent {
    constructor(
        private organiserService: OrganiserService,
        private gameLogicService: GameLogicService,
        private statsService: StatsService,
    ) {}

    passQuestion(): void {
        this.organiserService.nextQuestion();
    }

    canGoToNextQuestion(): boolean {
        return this.gameLogicService.getState() === PlayState.ShowingAnswers;
    }

    getSelectedChoices(): ChoiceVote[] {
        return this.statsService.getSelectedChoices();
    }

    getQuestionName(): string {
        return this.statsService.questionName;
    }

    getChoices(): string[] {
        return this.getSelectedChoices().map((c) => c.name);
    }

    isGameOver(): boolean {
        return this.statsService.isGameOver();
    }

    getGameResults(): GameResults {
        return this.statsService.getGameResults();
    }

    nextQuestion(): void {
        this.statsService.slideChart(Swipe.Right);
    }

    pastQuestion(): void {
        this.statsService.slideChart(Swipe.Left);
    }

    getButtonText(): string {
        return this.statsService.getGameCompletion() === 1.0 ? 'Voir les résultats' : 'Prochaine question';
    }
}

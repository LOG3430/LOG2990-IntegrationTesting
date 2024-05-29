import { Component } from '@angular/core';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { StatsService } from '@app/services/stats/stats.service';
import { PERCENTAGE } from '@common/constants';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent {
    constructor(
        private gameLogicService: GameLogicService,
        private gameService: GameService,
        private statsService: StatsService,
    ) {}

    howManyConfirmed(): number {
        return this.statsService.getHowManySubmitted();
    }

    totalPlayers(): number {
        return this.gameService.getPlayers().length;
    }

    completion(): number {
        return Math.round((this.howManyConfirmed() / this.totalPlayers()) * PERCENTAGE);
    }

    pause(): void {
        this.gameLogicService.pause();
    }

    isPaused(): boolean {
        return this.gameLogicService.isPaused();
    }

    pauseTooltip(): string {
        return this.isPaused() ? 'Reprendre' : 'Pause';
    }

    goPanic(): void {
        this.gameLogicService.goPanic();
    }

    canPanic(): boolean {
        return this.gameLogicService.canPanic();
    }

    canShowControls(): boolean {
        return this.isOrganiser() && this.isInAnsweringState();
    }

    private isInAnsweringState(): boolean {
        return this.gameLogicService.getState() === PlayState.Answering;
    }

    private isOrganiser(): boolean {
        return this.gameService.isOrganiser();
    }
}

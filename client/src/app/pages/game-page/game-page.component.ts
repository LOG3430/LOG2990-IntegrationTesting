import { Component, OnDestroy } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService, State } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { GameType } from '@common/events';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnDestroy {
    /* eslint-disable-next-line @typescript-eslint/naming-convention --
     * Explanation: We want to expose the State enum to our template,
     *              it is not really an attribute.
     */
    readonly State = State;

    constructor(
        private gameService: GameService,
        private gameLogicService: GameLogicService,
        private global: GlobalService,
    ) {}

    ngOnDestroy(): void {
        this.gameService.leave();
    }

    getTitle(): string {
        switch (this.gameService.getState()) {
            case State.Wait:
                return "Salle d'attente";
            case State.Present:
                return 'Salle de présentation';
            case State.Play:
                return this.isOrganiser() ? 'Statistiques de la question' : 'Salle de jeu';
            case State.Result:
                return 'Résultats de la partie';
            case State.Evaluation:
                return 'Évaluation des réponses';
        }
    }

    getTime(): number {
        return this.gameLogicService.getTime();
    }

    getState(): State {
        return this.gameService.getState();
    }

    isOrganiser(): boolean {
        return this.gameService.isOrganiser() && this.gameService.gameMode === GameType.Normal;
    }

    leaveGame(): void {
        this.global.dialog.confirmDialog('Êtes-vous sûr de vouloir abandonner la partie').subscribe((abandon) => {
            if (abandon) {
                this.global.router.navigate(['/home']);
            }
        });
    }

    hasRoom(): boolean {
        return this.gameService.getJoinResponse().success;
    }
}

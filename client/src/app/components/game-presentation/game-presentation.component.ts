import { Component } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';

@Component({
    selector: 'app-game-presentation',
    templateUrl: './game-presentation.component.html',
    styleUrls: ['./game-presentation.component.scss'],
})
export class GamePresentationComponent {
    constructor(
        private gameService: GameService,
        private gameLogicService: GameLogicService,
    ) {}

    getQuizTitle(): string {
        return this.gameService.getGameInfo().title;
    }

    getTime(): number {
        return this.gameLogicService.getTime();
    }
}

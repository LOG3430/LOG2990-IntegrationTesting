import { Component } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';

@Component({
    selector: 'app-remaining-time',
    templateUrl: './remaining-time.component.html',
    styleUrls: ['./remaining-time.component.scss'],
})
export class RemainingTimeComponent {
    constructor(private gameLogic: GameLogicService) {}

    isPanicking(): boolean {
        return this.gameLogic.isPanicking();
    }

    getTime(): number {
        return this.gameLogic.getTime();
    }
}

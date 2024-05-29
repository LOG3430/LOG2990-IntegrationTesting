import { Component, OnDestroy, OnInit } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-test-page',
    templateUrl: './test-page.component.html',
    styleUrls: ['./test-page.component.scss'],
})
export class TestPageComponent implements OnInit, OnDestroy {
    private subscription: Subscription;

    constructor(
        private gameService: GameService,
        private gameLogic: GameLogicService,
        private global: GlobalService,
    ) {}

    ngOnInit(): void {
        this.subscription = this.gameLogic.onGameOver().subscribe(() => {
            this.global.router.navigate(['/party/create']);
        });
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.gameService.leave();
    }

    hasRoom(): boolean {
        return this.gameService.getJoinResponse().success;
    }
}

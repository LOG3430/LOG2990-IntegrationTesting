import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '@app/services/game/game.service';
import { GAME_ROOM_ID_LEN, MAX_USERNAME_LENGTH } from '@common/constants';
import { PlayerInfos } from '@common/events';

@Component({
    selector: 'app-join-game-page',
    templateUrl: './join-game-page.component.html',
    styleUrls: ['./join-game-page.component.scss'],
})
export class JoinGamePageComponent {
    playerInfos: PlayerInfos = { roomId: '', username: '' };
    maxUsernameLength: number = MAX_USERNAME_LENGTH;
    idLength: number = GAME_ROOM_ID_LEN;

    constructor(
        private gameService: GameService,
        private readonly router: Router,
    ) {}

    join(): void {
        this.gameService.join(this.getInfo(), (success: boolean) => {
            if (success) {
                this.router.navigate(['/game', { room: this.playerInfos.roomId }]);
            }
        });
    }

    private getInfo(): PlayerInfos {
        return {
            roomId: this.playerInfos.roomId.trim(),
            username: this.playerInfos.username.trim(),
        };
    }
}

import { Component } from '@angular/core';
import { GameService } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { GameType } from '@common/events';

@Component({
    selector: 'app-waiting-area',
    templateUrl: './waiting-area.component.html',
    styleUrls: ['./waiting-area.component.scss'],
})
export class WaitingAreaComponent {
    private unlockState = true;

    constructor(
        private gameService: GameService,
        private organiserService: OrganiserService,
    ) {}

    getPlayers(): string[] {
        return this.gameService.getPlayers();
    }

    getTooltip(): string {
        return this.unlockState ? 'Vérouiller la salle' : 'Déverouiller la salle';
    }

    isMe(username: string): boolean {
        return this.gameService.isMe(username);
    }

    gameCode(): string {
        return this.gameService.gameCode();
    }

    isOrganiser(): boolean {
        return this.gameService.isOrganiser();
    }

    canStart(): boolean {
        return this.isOrganiser() && !this.isUnlocked() && (this.getPlayers().length > 0 || this.gameService.gameMode === GameType.Aleatoire);
    }

    startGame(): void {
        this.organiserService.startGame();
    }

    toggleLock(): void {
        this.organiserService.toggleLockGame().subscribe((isUnlocked) => {
            this.unlockState = isUnlocked;
        });
    }

    isUnlocked(): boolean {
        return this.unlockState;
    }

    ban(username: string) {
        this.organiserService.kickoutPlayer(username);
    }
}

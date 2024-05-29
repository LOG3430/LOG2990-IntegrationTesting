import { Injectable } from '@angular/core';
import { GameService, State } from '@app/services/game/game.service';
import { SocketService } from '@app/services/socket/socket.service';
import { Grade, OrganiserEvent } from '@common/events';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class OrganiserService {
    constructor(
        private socket: SocketService,
        private gameService: GameService,
    ) {}

    toggleLockGame(): Observable<boolean> {
        return new Observable((subscriber) => {
            this.socket.send(OrganiserEvent.ToggleLock, undefined, (toggleState: boolean) => {
                subscriber.next(toggleState);
                subscriber.unsubscribe();
            });
        });
    }

    kickoutPlayer(username: string) {
        this.socket.send(OrganiserEvent.KickOut, username);
    }

    startGame() {
        this.socket.send(OrganiserEvent.Start);
    }

    endGame() {
        this.socket.send(OrganiserEvent.EndGame);
    }

    nextQuestion() {
        this.socket.send(OrganiserEvent.RequestNewQuestion);
    }

    goToGameResults(): void {
        this.socket.send(OrganiserEvent.GoToGameResults);
    }

    sendGrades(grades: Grade[]) {
        this.socket.send(OrganiserEvent.sendResults, grades);
        this.gameService.setState(State.Play);
    }

    mutePlayer(username: string): void {
        this.socket.send(OrganiserEvent.MutePlayer, username);
    }
}

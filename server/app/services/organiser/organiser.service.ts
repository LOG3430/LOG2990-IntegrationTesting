import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { GameService } from '@app/services/game/game.service';
import { Grade, Leaderboard, LeaveReason, MessageEvent } from '@common/events';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class OrganiserService {
    constructor(private gameService: GameService) {}

    isOrganiser(socket: Socket): boolean {
        return this.getRoom(socket)?.isOrganiser(socket);
    }

    toggleRoomLock(socket: Socket): boolean {
        return this.getRoom(socket)?.toggleLock();
    }

    kickout(username: string) {
        const player = this.gameService.getPlayer(username)?.getSocket();
        this.getRoom(player)?.ban(player);
        if (player) {
            this.gameService.leave(player, LeaveReason.Banned);
        }
    }

    mutePlayer(socket: Socket, username: string) {
        const gameroom = this.gameService.getGameRoom(socket);
        const player = gameroom?.getPlayerByName(username);
        if (player) {
            player.isMuted = !player.isMuted;
            gameroom.room.toOrganiser(Leaderboard.send, gameroom.getLeaderboard());
            player.getSocket().emit(MessageEvent.Muted, player.isMuted);
            this.gameService.sendSystemMessage(
                gameroom.room,
                player.isMuted ? `${player.username} a perdu le droit de parole` : `${player.username} a regagné le droit de parole`,
            );
        }
    }

    nextQuestion(socket: Socket) {
        this.ready(socket);
    }

    goToGameResults(socket: Socket) {
        this.ready(socket);
    }

    sendCorrectionToRoom(socket: Socket, grades: Grade[]) {
        this.gameService.getGameRoom(socket)?.goToLAQResults(socket, grades);
    }

    start(socket: Socket) {
        this.gameService.getGameRoom(socket)?.startGame(socket);
    }

    pause(socket: Socket): boolean {
        return this.gameService.getGameRoom(socket)?.pauseTimer();
    }

    panic(socket: Socket) {
        this.gameService.getGameRoom(socket)?.panicTimer();
    }

    private getRoom(socket: Socket): Room<Player> | undefined {
        return this.gameService.getGameRoom(socket)?.room;
    }

    private ready(socket: Socket) {
        this.gameService.getGameRoom(socket)?.ready(socket);
    }
}

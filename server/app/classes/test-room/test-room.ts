import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { GameType } from '@common/events';
import { Socket } from 'socket.io';

export class TestRoom extends GameRoom {
    gameType = GameType.Test;

    override goToNextQuestion(): void {
        super.goToNextQuestion();
        this.readyInDelay();
    }

    override getPlayers(): Player[] {
        return [...[this.room.getOrganiser()].filter((x) => x)];
    }

    protected override getPlayer(socket: Socket): Player {
        const organiser = this.room.getOrganiser();
        return organiser?.getSocket().id === socket.id ? organiser : undefined;
    }

    protected override canStart(socket: Socket): boolean {
        return this.room.isOrganiser(socket);
    }

    protected override setStartDelay(): void {
        this.update();
    }
}

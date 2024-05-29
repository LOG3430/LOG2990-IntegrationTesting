import { GameRoom } from '@app/classes/game-room/game-room';
import { Player } from '@app/classes/player/player';
import { Socket } from 'socket.io';

export class RandomRoom extends GameRoom {
    override getPlayers(): Player[] {
        return [...this.room.getMembers(), ...[this.room.getOrganiser()].filter((x) => x)];
    }

    override goToNextQuestion(): void {
        super.goToNextQuestion();
        this.readyInDelay();
    }

    protected override getPlayer(socket: Socket): Player {
        const player = this.room.getMember(socket);
        if (player) return player;
        const organiser = this.room.getOrganiser();
        return organiser?.getSocket().id === socket.id ? organiser : undefined;
    }

    protected override canStart(socket: Socket): boolean {
        return !this.game.receivedStart && this.room.isOrganiser(socket) && !this.room.isUnlocked();
    }

    protected override onStart() {
        this.room.makeOrganiserPlayer();
        super.onStart();
    }
}

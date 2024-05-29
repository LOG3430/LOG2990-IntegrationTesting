import { GameService } from '@app/services/game/game.service';
import { BarChartEvent, Interaction, SelectedChoice } from '@common/events';
import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class BarChartService {
    constructor(private gameService: GameService) {}

    send(socket: Socket, selectedChoice: SelectedChoice) {
        this.gameService.getGameRoom(socket)?.selectChoice(socket, selectedChoice);
    }

    sendSelectedToOrganiser(socket: Socket) {
        this.gameService.getGameRoom(socket)?.room.toOrganiser(BarChartEvent.SendSelectedList, this.getVoteList(socket)?.getVotes());
    }

    sendInteraction(socket: Socket, interaction: Interaction) {
        this.gameService.getGameRoom(socket)?.updateInteraction(socket, interaction);
    }

    private getVoteList(socket: Socket) {
        return this.gameService.getGameRoom(socket)?.getSelectedVotes();
    }

    private getGradeCounts(socket: Socket) {
        return this.gameService.getGameRoom(socket)?.getGradeCounts();
    }
}

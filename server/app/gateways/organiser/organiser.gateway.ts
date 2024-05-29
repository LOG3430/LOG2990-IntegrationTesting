import { LoggingInterceptor } from '@app/interceptors/logging/logging.interceptor';
import { OrganiserOnlyInterceptor } from '@app/interceptors/organiser-only/organiser-only.interceptor';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { Grade, OrganiserEvent } from '@common/events';
import { UseInterceptors } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UseInterceptors(LoggingInterceptor, OrganiserOnlyInterceptor)
@WebSocketGateway({ cors: true })
export class OrganiserGateway {
    @WebSocketServer() private server: Server;

    constructor(private organiserService: OrganiserService) {}

    @SubscribeMessage(OrganiserEvent.ToggleLock)
    toggleLock(socket: Socket): boolean {
        return this.organiserService.toggleRoomLock(socket);
    }

    @SubscribeMessage(OrganiserEvent.KickOut)
    kickout(_: Socket, username: string) {
        this.organiserService.kickout(username);
    }

    @SubscribeMessage(OrganiserEvent.Start)
    start(socket: Socket) {
        this.organiserService.start(socket);
    }

    @SubscribeMessage(OrganiserEvent.RequestNewQuestion)
    nextQuestion(socket: Socket) {
        this.organiserService.nextQuestion(socket);
    }

    @SubscribeMessage(OrganiserEvent.GoToGameResults)
    goToGameResults(socket: Socket) {
        this.organiserService.goToGameResults(socket);
    }

    @SubscribeMessage(OrganiserEvent.sendResults)
    goToLAQResults(socket: Socket, grades: Grade[]) {
        this.organiserService.sendCorrectionToRoom(socket, grades);
    }

    @SubscribeMessage(OrganiserEvent.Pause)
    pause(socket: Socket): boolean {
        return this.organiserService.pause(socket);
    }

    @SubscribeMessage(OrganiserEvent.GoPanic)
    panic(socket: Socket) {
        this.organiserService.panic(socket);
    }

    @SubscribeMessage(OrganiserEvent.MutePlayer)
    mutePlayer(socket: Socket, username: string) {
        this.organiserService.mutePlayer(socket, username);
    }
}

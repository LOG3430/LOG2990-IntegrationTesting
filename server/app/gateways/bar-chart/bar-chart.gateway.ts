import { LoggingInterceptor } from '@app/interceptors/logging/logging.interceptor';
import { BarChartService } from '@app/services/bar-chart/bar-chart.service';
import { BarChartEvent, Interaction, SelectedChoice } from '@common/events';
import { UseInterceptors } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@UseInterceptors(LoggingInterceptor)
@WebSocketGateway()
export class BarChartGateway {
    @WebSocketServer() private server: Server;

    constructor(private barChartService: BarChartService) {}

    @SubscribeMessage(BarChartEvent.SendSelected)
    send(socket: Socket, selectedChoice: SelectedChoice) {
        this.barChartService.send(socket, selectedChoice);
        this.barChartService.sendSelectedToOrganiser(socket);
    }

    @SubscribeMessage(BarChartEvent.SendInteracted)
    sendInteraction(socket: Socket, interaction: Interaction) {
        this.barChartService.sendInteraction(socket, interaction);
    }
}

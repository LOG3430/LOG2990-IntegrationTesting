import { GameService } from '@app/services/game/game.service';
import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('game-controller')
export class GameController {
    constructor(private gameService: GameService) {}

    @Get('/idRoom')
    async checkRoomExists(roomId: string, @Res() res: Response) {
        res.status(this.gameService.roomExists(roomId) ? HttpStatus.OK : HttpStatus.NOT_FOUND).send();
    }
}

import { HistoryService } from '@app/services/history/history.service';
import { History } from '@common/history';
import { Controller, Delete, Get, Post } from '@nestjs/common';

@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}
    @Get()
    async findAll(): Promise<History[]> {
        return this.historyService.findAll();
    }

    @Post()
    async add(history: History): Promise<void> {
        this.historyService.add(history);
    }

    @Delete()
    async remove(): Promise<void> {
        this.historyService.remove();
    }
}

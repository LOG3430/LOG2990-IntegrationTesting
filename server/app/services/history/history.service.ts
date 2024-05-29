import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { History } from '@common/history';
import { Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';

@Injectable()
export class HistoryService {
    private history: Collection<History>;

    constructor(mongodb: MongoDbService) {
        this.history = mongodb.collection<History>('history');
    }

    async findAll(): Promise<History[]> {
        return this.history.find({}).toArray();
    }

    async add(history: History): Promise<void> {
        await this.history.insertOne(history);
    }

    async remove(): Promise<void> {
        await this.history.deleteMany({});
    }
}

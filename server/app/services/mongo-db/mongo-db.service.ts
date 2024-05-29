import { Injectable } from '@nestjs/common';
import 'dotenv/config';
import { Collection, CollectionOptions, Db, MongoClient, ServerApiVersion } from 'mongodb';

@Injectable()
export class MongoDbService {
    static mongoDbProvider = {
        provide: MongoDbService,
        useFactory: async (): Promise<MongoDbService> => {
            return MongoDbService.mongoDbFactory(process.env.DATABASE_CONNECTION_STRING, process.env.DATABASE_DB_NAME);
        },
    };

    private client: MongoClient;
    private db: Db;
    private connected: boolean = false;

    constructor(uri: string) {
        this.client = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            },
        });
    }

    static mongoDbFactory = async (uri: string, databaseName: string): Promise<MongoDbService> => {
        const mongoService = new MongoDbService(uri);
        await mongoService.connect(databaseName);
        return mongoService;
    };

    async connect(db: string) {
        if (this.isConnected()) {
            return;
        }

        await this.client.connect();
        this.connected = true;
        this.db = this.client.db(db);
    }

    async disconnect() {
        await this.client.close();
        this.connected = false;
    }

    isConnected(): boolean {
        return this.connected;
    }

    collection<T>(name: string, options?: CollectionOptions): Collection<T> {
        return this.db.collection<T>(name, options);
    }
}

import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './controllers/admin/admin.controller';
import { GameController } from './controllers/game-controller/game.controller';
import { HistoryController } from './controllers/history/history.controller';
import { QuestionController } from './controllers/question/question.controller';
import { QuizController } from './controllers/quiz/quiz.controller';
import { BarChartGateway } from './gateways/bar-chart/bar-chart.gateway';
import { ChatGateway } from './gateways/chat/chat.gateway';
import { GameGateway } from './gateways/game/game.gateway';
import { OrganiserGateway } from './gateways/organiser/organiser.gateway';
import { AuthenticationService } from './services/authentication/authentication.service';
import { BarChartService } from './services/bar-chart/bar-chart.service';
import { ChatService } from './services/chat/chat.service';
import { GameService } from './services/game/game.service';
import { HistoryService } from './services/history/history.service';
import { MongoDbService } from './services/mongo-db/mongo-db.service';
import { OrganiserService } from './services/organiser/organiser.service';
import { QuestionService } from './services/question/question.service';
import { QuizConverter } from './services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from './services/quiz-validator/quiz-validator.service';
import { QuizService } from './services/quiz/quiz.service';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (config: ConfigService) => ({
                uri: config.get<string>('DATABASE_CONNECTION_STRING'), // Loaded from .env
            }),
        }),
    ],
    controllers: [QuizController, AdminController, QuestionController, GameController, HistoryController],
    providers: [
        GameGateway,
        OrganiserGateway,
        Logger,
        QuizService,
        MongoDbService.mongoDbProvider,
        QuestionService,
        QuizConverter,
        QuestionService,
        QuizConverter,
        GameService,
        QuizValidatorService,
        ChatService,
        ChatGateway,
        AuthenticationService,
        OrganiserService,
        BarChartService,
        BarChartGateway,
        HistoryService,
    ],
})
export class AppModule {}

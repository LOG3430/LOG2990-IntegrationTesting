import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { Quiz } from '@common/quiz';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Collection } from 'mongodb';
import { QuizConverter } from '@app/services/quiz-converter/quiz-converter.service';
import { QuizValidatorService } from '@app/services/quiz-validator/quiz-validator.service';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { ModifyQuizDto } from '@app/model/dto/quiz/modify-quiz.dto';

@Injectable()
export class QuizService {
    private quizzes: Collection<Quiz>;

    constructor(
        mongodb: MongoDbService,
        private readonly quizConverter: QuizConverter,
        private readonly quizValidator: QuizValidatorService,
    ) {
        this.quizzes = mongodb.collection<Quiz>('quizzes');
    }

    async create(quizInfo: CreateQuizDto): Promise<HttpStatus> {
        const quiz: Quiz = this.quizConverter.createNewQuiz(quizInfo);
        if (!this.quizValidator.validateQuiz(quiz)) {
            return HttpStatus.BAD_REQUEST;
        }

        return (await this.createQuiz(quiz)) ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    async update(updatedInfo: ModifyQuizDto): Promise<HttpStatus> {
        const quiz = await this.getUpdatedQuiz(updatedInfo);
        if (!this.quizValidator.validateQuiz(quiz)) {
            return HttpStatus.BAD_REQUEST;
        }

        return (await this.updateQuiz(quiz)) ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    async findAll(): Promise<Quiz[]> {
        return this.quizzes.find({}, this.noIdProjection()).toArray();
    }

    async findOne(id: string): Promise<Quiz | null> {
        return this.quizzes.findOne({ id }, this.noIdProjection());
    }

    async removeOne(id: string): Promise<boolean> {
        return (await this.quizzes.deleteOne({ id })).deletedCount === 1;
    }

    async removeAll() {
        await this.quizzes.deleteMany({});
    }

    private noIdProjection() {
        return { projection: { _id: false } };
    }

    private async createQuiz(quiz: Quiz): Promise<boolean> {
        return (await this.quizzes.updateOne({ id: quiz.id }, { $setOnInsert: quiz }, { upsert: true })).upsertedCount === 1;
    }

    private async updateQuiz(quiz: Quiz): Promise<boolean> {
        const result = await this.quizzes.updateOne({ id: quiz.id }, { $set: quiz }, { upsert: true });
        return result.modifiedCount === 1 || result.upsertedCount === 1;
    }

    private async getUpdatedQuiz(updatedInfo: ModifyQuizDto): Promise<Quiz | null> {
        return this.quizConverter.updatedQuiz(updatedInfo);
    }
}

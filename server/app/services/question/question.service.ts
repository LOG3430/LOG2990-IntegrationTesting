import { MongoDbService } from '@app/services/mongo-db/mongo-db.service';
import { getDateString } from '@app/utils/date';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { HttpStatus, Injectable } from '@nestjs/common';
import { Collection, Filter } from 'mongodb';

@Injectable()
export class QuestionService {
    private questions: Collection<Question>;

    constructor(mongodb: MongoDbService) {
        this.questions = mongodb.collection<Question>('questions');
    }

    async findAll(): Promise<Question[]> {
        return this.questions.find({}, this.noIdProjection()).toArray();
    }

    async findOne(questionId: string): Promise<Question | null> {
        return this.questions.findOne({ id: questionId }, this.noIdProjection());
    }

    async create(question: Question): Promise<HttpStatus> {
        if ((await this.findOne(question.id)) || (await this.findOneByText(question.text))) {
            return HttpStatus.CONFLICT;
        }

        question.lastModif = getDateString();
        return (await this.insert(question)) ? HttpStatus.CREATED : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    async remove(questionId: string): Promise<HttpStatus> {
        return (await this.questions.deleteOne({ id: questionId })).deletedCount === 1 ? HttpStatus.OK : HttpStatus.NOT_FOUND;
    }

    async update(oldId: string, replacement: Question): Promise<HttpStatus> {
        if (await this.findOneByText(replacement.text, oldId)) {
            return HttpStatus.CONFLICT;
        }

        const result = await this.questions.updateOne(
            { id: oldId },
            { $set: { ...replacement, id: oldId, lastModif: getDateString() } },
            { upsert: true },
        );

        return result.modifiedCount === 1 || result.upsertedCount === 1 ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    async countDocuments(type: QTypes): Promise<number> {
        return this.questions.countDocuments({ type });
    }

    async findMultiple(amount: number, type: QTypes): Promise<Question[] | null> {
        // @ts-ignore
        return this.questions.aggregate([{ $match: { type } }, { $sample: { size: amount } }]).toArray();
    }

    private async findOneByText(text: string, excludedId?: string): Promise<Question | null> {
        return this.questions.findOne(this.excludeIdFilter(text, excludedId));
    }

    private excludeIdFilter(text: string, id?: string): Filter<Question> {
        return id ? { text, id: { $not: { $eq: id } } } : { text };
    }

    private noIdProjection() {
        return { projection: { _id: false } };
    }

    private async insert(question: Question): Promise<boolean> {
        return (await this.questions.updateOne({ id: question.id }, { $setOnInsert: question }, { upsert: true })).upsertedCount === 1;
    }
}

import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { ModifyQuizDto } from '@app/model/dto/quiz/modify-quiz.dto';
import { QuestionsDto } from '@app/model/dto/quiz/question.dto';
import { getDateString } from '@app/utils/date';
import { Choice } from '@common/choice';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { Quiz } from '@common/quiz';
import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuizConverter {
    createNewQuiz(quizInfo: CreateQuizDto): Quiz {
        return {
            ...quizInfo,
            id: uuidv4(),
            visibility: false,
            lastModification: getDateString(),
            questions: this.convertQuestions(quizInfo.questions),
        };
    }

    updatedQuiz(quiz: ModifyQuizDto): Quiz {
        return {
            ...quiz,
            questions: this.convertQuestions(quiz.questions),
            lastModification: getDateString(),
        };
    }

    convertQuestion(questionsInfo: QuestionsDto): Question {
        return {
            id: uuidv4(),
            lastModif: getDateString(),
            text: questionsInfo.text,
            points: questionsInfo.points,
            choices: questionsInfo.choices as Choice[],
            type: this.getType(questionsInfo.choices as Choice[], questionsInfo.type),
        };
    }

    private getType(answer: Choice[] | undefined, type?: string | QTypes): QTypes {
        if (!type) return Array.isArray(answer) ? QTypes.MCQ : QTypes.LAQ;

        if (typeof type === 'string') {
            if (type === '0' || type.toUpperCase() === 'QCM') return QTypes.MCQ;
            if (type === '1' || type.toUpperCase() === 'QRL') return QTypes.LAQ;
        }
    }

    private convertQuestions(questionsInfo: QuestionsDto[]): Question[] {
        return questionsInfo.map((q) => this.convertQuestion(q));
    }
}

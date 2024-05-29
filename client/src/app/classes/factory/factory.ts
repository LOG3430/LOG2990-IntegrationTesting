import { Quiz } from '@common/quiz';

export class Factory {
    static makeQuiz(): Quiz {
        return {
            id: '',
            title: '',
            description: '',
            duration: 10,
            lastModification: '',
            questions: [],
            visibility: false,
        };
    }
}

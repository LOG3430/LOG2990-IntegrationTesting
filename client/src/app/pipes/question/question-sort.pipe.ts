import { Pipe, PipeTransform } from '@angular/core';
import { Question } from '@common/question';

@Pipe({
    name: 'questionSort',
})
export class QuestionSortPipe implements PipeTransform {
    transform(questions: Question[]): Question[] {
        return questions.sort((a, b) => {
            return new Date(a.lastModif).getTime() - new Date(b.lastModif).getTime();
        });
    }
}

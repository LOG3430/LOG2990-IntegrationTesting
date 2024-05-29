import { Pipe, PipeTransform } from '@angular/core';
import { Quiz } from '@common/quiz';

@Pipe({
    name: 'quizSort',
})
export class QuizSortPipe implements PipeTransform {
    transform(quizzes: Quiz[]): Quiz[] {
        return quizzes.sort((a, b) => {
            return new Date(a.lastModification).getTime() - new Date(b.lastModification).getTime();
        });
    }
}

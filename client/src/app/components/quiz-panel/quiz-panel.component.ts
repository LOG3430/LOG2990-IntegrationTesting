import { Component, Input } from '@angular/core';
import { Quiz } from '@common/quiz';

@Component({
    selector: 'app-quiz-panel',
    templateUrl: './quiz-panel.component.html',
    styleUrls: ['./quiz-panel.component.scss'],
})
export class QuizPanelComponent {
    @Input() quiz: Quiz;
}

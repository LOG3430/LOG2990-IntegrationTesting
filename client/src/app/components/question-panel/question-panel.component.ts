import { Component, Input } from '@angular/core';
import { Question } from '@common/question';

@Component({
    selector: 'app-question-panel',
    templateUrl: './question-panel.component.html',
    styleUrls: ['./question-panel.component.scss'],
})
export class QuestionPanelComponent {
    @Input() index: number;
    @Input() question: Question;
    @Input() color: string = 'white';
}

import { Component, Input } from '@angular/core';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { QuestionResults } from '@common/events';
import { QTypes } from '@common/question-type';

@Component({
    selector: 'app-answers',
    templateUrl: './answers.component.html',
    styleUrls: ['./answers.component.scss'],
})
export class AnswersComponent {
    @Input() questionResults: QuestionResults = { points: 0, hasBonus: false, goodAnswers: [] };

    constructor(private gameLogic: GameLogicService) {}

    isMCQ(): boolean {
        return this.gameLogic.getType() === QTypes.MCQ;
    }
}

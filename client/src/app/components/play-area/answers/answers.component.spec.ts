import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { GameQuestion, QuestionResults } from '@common/events';
import { QTypes } from '@common/question-type';
import { Subject } from 'rxjs';
import { AnswersComponent } from './answers.component';

describe('AnswersComponent', () => {
    let component: AnswersComponent;
    let fixture: ComponentFixture<AnswersComponent>;
    let gameLogic: jasmine.SpyObj<GameLogicService>;

    const resultsSubject: Subject<QuestionResults> = new Subject<QuestionResults>();
    const questionSubject: Subject<void> = new Subject<void>();
    const question: GameQuestion = { points: 0, index: 0, text: '', choices: ['a', 'b'], type: QTypes.MCQ };

    beforeEach(() => {
        gameLogic = jasmine.createSpyObj('GameLogicService', ['getType', 'getCurrentQuestion', 'onNewQuestion', 'onReceiveResults', 'getState']);
        gameLogic.onReceiveResults.and.returnValue(resultsSubject);
        gameLogic.onNewQuestion.and.returnValue(questionSubject);
        gameLogic.getCurrentQuestion.and.returnValue(question);
        gameLogic.getState.and.returnValue(PlayState.Answering);

        TestBed.configureTestingModule({
            providers: [{ provide: GameLogicService, useValue: gameLogic }],
            declarations: [AnswersComponent],
        });
        fixture = TestBed.createComponent(AnswersComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should retur true if question is type MCQ', () => {
        gameLogic.getType.and.returnValue(QTypes.MCQ);
        expect(component.isMCQ()).toBeTruthy();
    });
});

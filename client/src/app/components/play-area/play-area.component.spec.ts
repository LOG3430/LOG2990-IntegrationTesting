import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Key, PlayAreaComponent } from '@app/components/play-area/play-area.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { enumValues } from '@app/utils/enum-values';
import { INTERACTION_DELAY } from '@common/constants';
import { GameQuestion, QuestionResults } from '@common/events';
import { QTypes } from '@common/question-type';
import { Subject } from 'rxjs';
import { AnswersComponent } from './answers/answers.component';

@Component({ selector: 'app-remaining-time' })
class RemainingTimeComponent {}

describe('PlayAreaComponent', () => {
    let component: PlayAreaComponent;
    let fixture: ComponentFixture<PlayAreaComponent>;
    let gameLogicService: jasmine.SpyObj<GameLogicService>;
    let gameService: jasmine.SpyObj<GameService>;

    const resultsSubject: Subject<QuestionResults> = new Subject<QuestionResults>();
    const questionSubject: Subject<void> = new Subject<void>();
    const question: GameQuestion = { points: 0, index: 0, text: '', choices: ['a', 'b'], type: QTypes.MCQ };

    beforeEach(async () => {
        gameService = jasmine.createSpyObj('GameService', ['getGameInfo', 'isOrganiser']);
        gameService.getGameInfo.and.returnValue({ title: 'abc', numberOfQuestions: 2 });

        gameLogicService = jasmine.createSpyObj<GameLogicService>('GameLogicService', [
            'getCurrentQuestion',
            'submit',
            'onReceiveResults',
            'onNewQuestion',
            'getUserScore',
            'onGameOver',
            'select',
            'sendInteraction',
            'getState',
            'getType',
        ]);

        gameLogicService.onReceiveResults.and.returnValue(resultsSubject);
        gameLogicService.onNewQuestion.and.returnValue(questionSubject);
        gameLogicService.getCurrentQuestion.and.returnValue(question);
        gameLogicService.getState.and.returnValue(PlayState.Answering);

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [PlayAreaComponent, AnswersComponent, RemainingTimeComponent],
            providers: [
                { provide: GameLogicService, useValue: gameLogicService },
                { provide: GameService, useValue: gameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(PlayAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('submitting', () => {
        beforeEach(() => {
            gameLogicService.getState.and.returnValue(PlayState.Answering);
        });

        describe('mcq', () => {
            beforeEach(() => {
                gameLogicService.getType.and.returnValue(QTypes.MCQ);
            });

            it('submitAnswer MCQ ask gameLogic to submit', () => {
                component.selectedChoices = [1, 2];
                component.submitAnswer();
                expect(gameLogicService.submit).toHaveBeenCalledOnceWith([1, 2]);
                expect(component.selectedChoices).toEqual([]);
            });

            it('should not submit if already submitted', () => {
                component.selectedChoices = [1, 2];

                enumValues(PlayState)
                    .filter((s) => s !== PlayState.Answering)
                    .forEach((state) => {
                        gameLogicService.getState.and.returnValue(state);
                        component.submitAnswer();
                        expect(gameLogicService.submit).not.toHaveBeenCalled();
                        expect(component.selectedChoices).toEqual([1, 2]);
                    });
            });
        });

        describe('laq', () => {
            beforeEach(() => {
                gameLogicService.getType.and.returnValue(QTypes.LAQ);
            });

            it('submitAnswer LAQ ask gameLogic to submit', () => {
                component['answerText'] = 'bla';
                component.submitAnswer();
                expect(gameLogicService.submit).toHaveBeenCalledOnceWith('bla');
                expect(component['answerText']).toEqual('');
            });

            it('should not submit if already submitted', () => {
                component['answerText'] = 'bla';

                enumValues(PlayState)
                    .filter((s) => s !== PlayState.Answering)
                    .forEach((state) => {
                        gameLogicService.getState.and.returnValue(state);
                        component.submitAnswer();
                        expect(gameLogicService.submit).not.toHaveBeenCalled();
                        expect(component['answerText']).toEqual('bla');
                    });
            });
        });
    });

    it('isOrganiser should return result given by gameService', () => {
        gameService.isOrganiser.and.returnValue(true);
        expect(component.isOrganiser()).toBeTrue();
    });

    describe('clicks', () => {
        it('selecting value by click should add answer to selectedChoices variable', () => {
            component.selectedChoices = [];
            component.triggerAnswerClick(0);
            expect(component.selectedChoices).toEqual([0]);
        });

        it('selecting value by click should remove answer from selectedChoices when already there', () => {
            component.selectedChoices = [1];
            component.triggerAnswerClick(1);
            expect(component.selectedChoices).toEqual([]);
        });

        it('toggle should do nothing if already submitted ', () => {
            enumValues(PlayState)
                .filter((s) => s !== PlayState.Answering)
                .forEach((state) => {
                    gameLogicService.getState.and.returnValue(state);
                    component.toggle(2);
                    expect(gameLogicService.select).toHaveBeenCalledTimes(0);
                });
        });
    });

    describe('keyboard shortcuts', () => {
        it('pressing keys 1-4 should call triggerAnswerClick', () => {
            const triggerAnswerClickSpy = spyOn(component, 'triggerAnswerClick');
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            triggerAnswerClickSpy.and.callFake(() => {});
            [Key.One, Key.Two, Key.Three, Key.Four].forEach((key) => {
                const event = new KeyboardEvent('keydown', { key });
                component.handleKeyDown(event);
                expect(triggerAnswerClickSpy).toHaveBeenCalled();
                triggerAnswerClickSpy.calls.reset();
            });
        });

        it("should only work if it's a valid index", () => {
            gameLogicService.getCurrentQuestion.and.returnValue({ choices: ['a', 'b'] } as unknown as GameQuestion);
            component.selectedChoices = [];

            [Key.One, Key.Two, Key.Three, Key.Four].forEach((key) => {
                const event = new KeyboardEvent('keydown', { key });
                component.handleKeyDown(event);
            });

            expect(component.selectedChoices).toEqual([0, 1]);
        });

        it('pressing Enter should call submitAnswer if MCQ', () => {
            const triggerSubmit = spyOn(component, 'submitAnswer');
            gameLogicService.getType.and.returnValue(QTypes.MCQ);
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            triggerSubmit.and.callFake(() => {});
            const event = new KeyboardEvent('keydown', { key: Key.Enter });
            component.handleKeyDown(event);
            expect(component.submitAnswer).toHaveBeenCalled();
        });

        it('pressing Enter should not call submitAnswer if LAQ', () => {
            const triggerSubmit = spyOn(component, 'submitAnswer');
            gameLogicService.getType.and.returnValue(QTypes.LAQ);
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            triggerSubmit.and.callFake(() => {});
            const event = new KeyboardEvent('keydown', { key: Key.Enter });
            component.handleKeyDown(event);
            expect(component.submitAnswer).toHaveBeenCalledTimes(0);
        });
    });

    it('pressing key should not call triggerAnswerClick if isSubmit', () => {
        gameLogicService.getState.and.returnValue(PlayState.Submitted);
        spyOn(component, 'triggerAnswerClick');
        const event = new KeyboardEvent('keydown', { key: Key.One });
        component.handleKeyDown(event);
        expect(component.triggerAnswerClick).not.toHaveBeenCalled();
    });

    it('pressing key should not call triggerAnswerClick if not 1-4 or entered', () => {
        spyOn(component, 'triggerAnswerClick');
        const event = new KeyboardEvent('keydown', { key: 'a' });
        component.handleKeyDown(event);
        expect(component.triggerAnswerClick).not.toHaveBeenCalled();
    });

    it('should reset results when new question received', () => {
        const answer = { points: 2, goodAnswers: ['oui', 'non'], hasBonus: true };
        resultsSubject.next(answer);
        expect(component.results).toBe(answer);
        questionSubject.next();
        expect(component.results).toEqual(null);
    });

    it('should show results when onReceiveResults is called', () => {
        const answer = { points: 2, goodAnswers: ['oui', 'non'], hasBonus: true };
        gameLogicService.getState.and.returnValue(PlayState.ShowingAnswers);
        resultsSubject.next(answer);
        expect(component.isShowingAnswers()).toBeTrue();
        expect(component.results).toBe(answer);
    });

    it('should get userScore from gameLogicService', () => {
        expect(gameLogicService.getUserScore()).toEqual(component.getUserScore());
    });

    it('should get current question index from gameLogicService', () => {
        expect(gameLogicService.getCurrentQuestion().index).toEqual(component.getCurrentQuestionIndex());
    });

    it('should get number of questions from gameService', () => {
        expect(gameService.getGameInfo().numberOfQuestions).toEqual(component.getNumberOfQuestions());
    });

    it('html element', () => {
        const text = 'allo';
        const mockEventKeyboard: KeyboardEvent = {
            target: { value: text },
        } as unknown as KeyboardEvent;

        component.update(mockEventKeyboard);
        expect(component['answerText']).toBe(text);
    });

    it('setTimeout', fakeAsync(() => {
        component.update({ target: { value: 'bla' } } as unknown as KeyboardEvent);
        expect(gameLogicService.sendInteraction).toHaveBeenCalledWith({ isChanged: true, answerText: 'bla' });

        tick(INTERACTION_DELAY * 2);
        fixture.detectChanges();

        fixture.whenStable().then(() => {
            expect(gameLogicService.sendInteraction).toHaveBeenCalledWith({ isChanged: false, answerText: 'bla' });
        });
    }));

    describe('qrl answer area', () => {
        it('should not update if isSubmitted', () => {
            component['interact'] = jasmine.createSpy();

            gameLogicService.getState.and.returnValue(PlayState.WaitingEvaluation);
            component.update({ target: { value: 'bla' } } as unknown as KeyboardEvent);

            expect(component['answerText']).toEqual('');
            expect(component['interact']).not.toHaveBeenCalled();
        });
    });

    it('should tell if waiting for evaluation', () => {
        gameLogicService.getState.and.returnValue(PlayState.WaitingEvaluation);
        expect(component.isWaitingEvaluation()).toBeTruthy();
    });
});

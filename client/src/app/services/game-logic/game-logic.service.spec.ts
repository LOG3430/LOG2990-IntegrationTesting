import { TestBed } from '@angular/core/testing';
import { SocketService } from '@app/services/socket/socket.service';
import { EventEmitFunc, mockServerResponse, socketServiceMock } from '@app/utils/socket-test-helpers';
import { SECOND } from '@common/constants';
import { BarChartEvent, GameEvent, GameQuestion, Interaction, OrganiserEvent, QuestionResults, SelectedChoice } from '@common/events';
import { QTypes } from '@common/question-type';
import { GameLogicService, PlayState } from './game-logic.service';

/* eslint-disable @typescript-eslint/no-magic-numbers */

const gameQuestion: GameQuestion = { text: 'Question text', index: 1, points: 5, choices: ['A', 'B'], type: QTypes.MCQ };
const questionResults: QuestionResults = {
    points: 3,
    hasBonus: false,
    goodAnswers: ['Correct', 'Wrong'],
};

describe('GameLogicService', () => {
    let service: GameLogicService;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;
    let emulateServerEvent: EventEmitFunc;

    beforeEach(() => {
        [socketServiceSpy, emulateServerEvent] = socketServiceMock();

        TestBed.configureTestingModule({
            providers: [GameLogicService, { provide: SocketService, useValue: socketServiceSpy }],
        });

        service = TestBed.inject(GameLogicService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should use socket service to submit MCQ', () => {
        const answers = [3, 2, 1];
        service.getType = jasmine.createSpy().and.returnValue(QTypes.MCQ);
        service.submit(answers);
        expect(socketServiceSpy.send).toHaveBeenCalledOnceWith(GameEvent.SubmitMCQ, answers);
    });

    it('should use socket service to submit LAQ', () => {
        const answer = 'blabla';
        service.getType = jasmine.createSpy().and.returnValue(QTypes.LAQ);
        service.submit(answer);
        expect(socketServiceSpy.send).toHaveBeenCalledOnceWith(GameEvent.SubmitLAQ, answer);
    });

    it('should sent sendInteracted event', () => {
        const hasModified = { isChanged: true } as Interaction;
        service.sendInteraction(hasModified);
        expect(socketServiceSpy.send).toHaveBeenCalledWith(BarChartEvent.SendInteracted, hasModified);
    });

    it('should send sendSelected event with the selected choices', () => {
        const choice = {} as SelectedChoice;
        service.select(choice);
        expect(socketServiceSpy.send).toHaveBeenCalledOnceWith(BarChartEvent.SendSelected, choice);
    });

    it('should return the time', () => {
        const timeToGet = 60;
        service['time'] = timeToGet;
        expect(service.getTime()).toBe(timeToGet);
    });

    it('should return the user score', () => {
        const score = 10;
        service['userScore'] = score;
        expect(service.getUserScore()).toBe(score);
    });

    it('should return the current question', () => {
        const currentQuestion = { points: 0, index: 1, text: 'current question', choices: ['oui', 'non'], type: QTypes.MCQ };
        service['question'] = currentQuestion;
        expect(service.getCurrentQuestion()).toBe(currentQuestion);
    });

    it('getType should get type', () => {
        service.getCurrentQuestion = jasmine.createSpy().and.returnValue({ points: 10, index: 1, text: 'allo', type: QTypes.LAQ });
        const type = service.getType();
        expect(type).toEqual(QTypes.LAQ);
    });

    describe('play state', () => {
        it('should be in answering state initially', () => {
            expect(service.getState()).toBe(PlayState.Answering);
        });

        it('should go to submitted state after submitting', () => {
            service['question'] = { type: QTypes.MCQ } as GameQuestion;
            service.submit([]);
            expect(service.getState()).toBe(PlayState.Submitted);
        });

        it('should go to answering state when receiving new question', () => {
            emulateServerEvent(GameEvent.IsShowingAnswers);
            expect(service.getState()).not.toBe(PlayState.Answering);
            emulateServerEvent(GameEvent.NewQuestion);
            expect(service.getState()).toBe(PlayState.Answering);
        });

        it('should go to waiting evaluation state when receiving question evaluation event', () => {
            emulateServerEvent(GameEvent.QuestionEvaluation);
            expect(service.getState()).toBe(PlayState.WaitingEvaluation);
        });

        it('should go to showing answers state when receiving question results', () => {
            emulateServerEvent(GameEvent.IsShowingAnswers);
            expect(service.getState()).toBe(PlayState.ShowingAnswers);
        });
    });

    describe('server events', () => {
        it('should start listening in constructor', () => {
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.Tick, jasmine.any(Function));
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.NewQuestion, jasmine.any(Function));
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.QuestionResults, jasmine.any(Function));
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.Gameover, jasmine.any(Function));
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.Panicking, jasmine.any(Function));
            expect(socketServiceSpy.on).toHaveBeenCalledWith(GameEvent.IsShowingAnswers, jasmine.any(Function));
        });

        describe('new question', () => {
            it('should update question when NewQuestion event', () => {
                emulateServerEvent(GameEvent.NewQuestion, gameQuestion);
                expect(service.getCurrentQuestion()).toBe(gameQuestion);
            });

            it('should emit event when new question received', () => {
                const listener = jasmine.createSpy();
                const subscription = service.onNewQuestion().subscribe(listener);

                emulateServerEvent(GameEvent.NewQuestion, gameQuestion);

                expect(listener).toHaveBeenCalled();
                subscription.unsubscribe();
            });
        });

        describe('evaluation', () => {
            describe('question results', () => {
                it('should update score on QuestionResults event', () => {
                    emulateServerEvent(GameEvent.QuestionResults, questionResults);
                    expect(service.getUserScore()).toBe(questionResults.points);
                });

                it('should emit event when receiving results', () => {
                    const listener = jasmine.createSpy();
                    const subscription = service.onReceiveResults().subscribe(listener);

                    emulateServerEvent(GameEvent.QuestionResults, questionResults);

                    expect(listener).toHaveBeenCalledWith(questionResults);
                    subscription.unsubscribe();
                });
            });

            it('should update time when tick event', () => {
                const time = 1005;
                emulateServerEvent(GameEvent.Tick, time);
                expect(service.getTime()).toBe(1);
            });

            describe('game over', () => {
                it('should emit on GameOver event', () => {
                    const listener = jasmine.createSpy();
                    const subscription = service.onGameOver().subscribe(listener);
                    emulateServerEvent(GameEvent.Gameover, undefined);

                    expect(listener).toHaveBeenCalledTimes(1);
                    subscription.unsubscribe();
                });
            });
        });

        describe('timer', () => {
            it('pause should send pause event in socket', () => {
                socketServiceSpy.send.and.callFake(mockServerResponse(OrganiserEvent.Pause, true));
                service.pause();
                expect(service.isPaused()).toBe(true);
            });

            it('should reset panic and pause when showing answers', () => {
                service['panicMode'] = true;
                service['paused'] = true;
                emulateServerEvent(GameEvent.IsShowingAnswers);
                expect(service.isPanicking()).toBeFalse();
                expect(service.isPaused()).toBeFalse();
            });

            describe('panic functions', () => {
                it('goPanic should send goPanic event', () => {
                    service.goPanic();
                    expect(socketServiceSpy.send).toHaveBeenCalledWith(OrganiserEvent.GoPanic);
                });

                it('isPanicking should get panic', () => {
                    [true, false].forEach((val: boolean) => {
                        service['panicMode'] = val;
                        expect(service.isPanicking()).toEqual(val);
                    });
                });

                it('canPanic should verify if time is in cutoff', () => {
                    emulateServerEvent(GameEvent.Tick, 200 * SECOND);
                    expect(service.canPanic()).toEqual(true);
                    emulateServerEvent(GameEvent.Tick, 9 * SECOND);
                    expect(service.canPanic()).toEqual(false);
                });

                it('should panic when panicking event is received', () => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-function
                    const sound = spyOn<any>(service, 'playSound').and.callFake(() => {});

                    emulateServerEvent(GameEvent.Panicking);
                    expect(sound).toHaveBeenCalled();
                    expect(service.isPanicking()).toBeTrue();
                });

                it('should play sound from the correct source', () => {
                    class MockAudio {
                        src: string = '';
                        load = jasmine.createSpy('load');
                        play = jasmine.createSpy('play');
                    }
                    const audioMock = new MockAudio() as unknown as HTMLAudioElement;
                    spyOn(window, 'Audio').and.returnValue(audioMock);
                    service['playSound']();
                    expect(audioMock.src).toContain('assets/vineboom.mp3');
                    expect(audioMock.load).toHaveBeenCalled();
                    expect(audioMock.play).toHaveBeenCalled();
                });
            });
        });
    });
});

import { TestBed } from '@angular/core/testing';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameInfo, GameService } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { SocketService } from '@app/services/socket/socket.service';
import { EventEmitFunc, socketServiceMock } from '@app/utils/socket-test-helpers';
import { Swipe } from '@common/constants';
import { BarChartEvent, ChoiceVote, GameEvent, GameQuestion, GameResults, GradeCategory, GradeCount, SubmitInfos } from '@common/events';
import { QTypes } from '@common/question-type';
import { Subject, of } from 'rxjs';
import { StatsService } from './stats.service';

const choiceVoteTest: ChoiceVote = {
    name: 'choice1',
    votes: 1,
    isCorrect: true,
};

const questionTest: GameQuestion = {
    points: 10,
    index: 1,
    text: 'test',
    choices: [],
    type: QTypes.MCQ,
};

const submitInfos: SubmitInfos = {
    howManySubmitted: 1,
};

const gradeCount: GradeCount = {
    [GradeCategory.Zero]: 0,
    [GradeCategory.Fifty]: 0,
    [GradeCategory.Hundred]: 0,
};

const gradeCountList: GradeCount[] = [gradeCount, gradeCount];

describe('StatsService', () => {
    let service: StatsService;
    let gameSpy: jasmine.SpyObj<GameService>;
    let gameLogicSpy: jasmine.SpyObj<GameLogicService>;
    let organiserSpy: jasmine.SpyObj<OrganiserService>;
    let emulateServerEvent: EventEmitFunc;
    let socketServiceSpy: jasmine.SpyObj<SocketService>;

    beforeEach(() => {
        gameSpy = jasmine.createSpyObj('GameService', ['getPlayers', 'getGameResults', 'isGameOver', 'onGameOver', 'getGameInfo']);
        gameLogicSpy = jasmine.createSpyObj('GameLogicService', ['getCurrentQuestion', 'onNewQuestion']);
        [socketServiceSpy, emulateServerEvent] = socketServiceMock();
        gameSpy.onGameOver.and.returnValue(of(undefined));

        gameLogicSpy.getCurrentQuestion.and.returnValue({ text: 'allo', points: 10 } as GameQuestion);
        gameLogicSpy.onNewQuestion.and.returnValue(of(undefined));

        TestBed.configureTestingModule({
            providers: [
                { provide: GameService, useValue: gameSpy },
                { provide: GameLogicService, useValue: gameLogicSpy },
                { provide: OrganiserService, useValue: organiserSpy },
                { provide: SocketService, useValue: socketServiceSpy },
            ],
        });

        service = TestBed.inject(StatsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('onChartUpdate should return subject', () => {
        const fakeSubject = {} as unknown as Subject<void>;
        service['chartSubject'] = fakeSubject;
        expect(service.onChartUpdate()).toEqual(fakeSubject);
    });

    it('getGameCompletion should return fraction of completion of game', () => {
        gameLogicSpy.getCurrentQuestion.and.returnValue({ index: 1 } as unknown as GameQuestion);
        gameSpy.getGameInfo.and.returnValue({ numberOfQuestions: 4 } as unknown as GameInfo);
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        expect(service.getGameCompletion()).toEqual(0.5);
    });

    it('it should configure socket for SendSubmitList', () => {
        emulateServerEvent(BarChartEvent.SendSubmitList, submitInfos);
        expect(service['howManySubmitted']).toEqual(submitInfos.howManySubmitted);
    });

    it('it should configure socket for SendFinalGrades', () => {
        emulateServerEvent(BarChartEvent.SendFinalGrades, gradeCountList);
        expect(service['finalGradeCount']).toEqual(gradeCountList);
    });

    it('should update input choice on sendSelectedList event', () => {
        let vote: ChoiceVote = {} as ChoiceVote;
        const sub = service.onChartUpdate().subscribe(() => {
            vote = service.getSelectedChoices()[0];
        });
        emulateServerEvent(BarChartEvent.SendSelectedList, [choiceVoteTest]);
        sub.unsubscribe();
        expect(vote.name).toBe(choiceVoteTest.name);
        expect(vote.votes).toBe(choiceVoteTest.votes);
        expect(vote.isCorrect).toBe(choiceVoteTest.isCorrect);
    });

    it('should listen to new question', () => {
        gameLogicSpy.onNewQuestion.and.returnValue(of(undefined));
        expect(service['howManySubmitted']).toEqual(0);
    });

    describe('getter', () => {
        it('should return the name of the questions choices', () => {
            service.setQuestionName(questionTest);
            expect(service.questionName).toEqual(`${questionTest.text} (${questionTest.points})`);
        });

        it('should return the name of all the questions choices', () => {
            service['inputChoice'] = [choiceVoteTest];
            expect(service.getQuestionChoices()).toEqual([choiceVoteTest.name]);
        });

        it('should return all players alive', () => {
            const players = ['user1', 'user2'];
            gameSpy.getPlayers.and.returnValue(players);
            expect(service.getPlayersAlive()).toEqual(players);
        });

        it('should put hasNotInteracted to 0', () => {
            gameSpy.getPlayers.and.returnValue([]);
            expect(service['hasNotInteracted']).toEqual(0);
            expect(service.getPlayersAlive()).toEqual([]);
        });

        it('should return the selected choices', () => {
            service['inputChoice'] = [choiceVoteTest];
            expect(service.getSelectedChoices()).toEqual([choiceVoteTest]);
        });

        it('should return the index of the result', () => {
            service['resultIndex'] = 1;
            expect(service.getQuestionIndex()).toEqual(1);
        });

        it('shoud return the results of the game', () => {
            const gameResults: GameResults = { question: [questionTest], votes: [[choiceVoteTest]] };
            gameSpy.getGameResults.and.returnValue(gameResults);
            expect(service.getGameResults()).toEqual(gameResults);
        });

        it('should return how many submitted', () => {
            service['howManySubmitted'] = 1;
            expect(service.getHowManySubmitted()).toEqual(1);
        });
    });

    it('should call isGameOver from gameService', () => {
        gameSpy.isGameOver.and.returnValue(true);
        expect(service.isGameOver()).toBeTruthy();
    });

    it('should call slideChart', () => {
        service['resultIndex'] = 0;
        const gameResults: GameResults = { question: [questionTest, questionTest], votes: [[choiceVoteTest], [choiceVoteTest]] };

        gameSpy.isGameOver.and.returnValue(true);
        gameSpy.getGameResults.and.returnValue(gameResults);

        service.slideChart(Swipe.Right);
        expect(service['resultIndex']).toEqual(1);
        service.slideChart(Swipe.Right);
        expect(service['resultIndex']).toEqual(0);
        service.slideChart(Swipe.Left);
        expect(service['resultIndex']).toEqual(1);
        service.slideChart(Swipe.Left);
        expect(service['resultIndex']).toEqual(0);
    });

    it('should update chart', () => {
        gameSpy.isGameOver.and.returnValue(true);
        gameSpy.getGameResults.and.returnValue({ question: [{ points: 1, text: 'allo' } as GameQuestion], votes: [[{} as ChoiceVote]] });
        service['inputChoice'] = [];
        service['resultIndex'] = 0;
        service['updateGameResultChart']();
        const votes = service.getGameResults().votes;
        if (votes) {
            expect(service['inputChoice']).toEqual(votes[0]);
        }
    });

    it('should return QRL grade categories', () => {
        service['isShowingAnswers'] = true;
        expect(service.getGradeCategories()).toEqual(['0', '50', '100']);
    });

    it('should return the QRL grade categories during answering', () => {
        service['isShowingAnswers'] = false;
        expect(service.getGradeCategories()).toEqual(['a  modifié', "n'a pas modifié"]);
    });

    it('should return the gradeCount', () => {
        service['gradeCount'] = gradeCount;
        expect(service.getGradeCounts()).toEqual(gradeCount);
    });

    it('should return the finalGradeCount', () => {
        service['finalGradeCount'] = gradeCountList;
        expect(service.getFinalGradeCount()).toEqual(gradeCountList);
    });

    it('should return a list of the grades count when isShowingAnswers is true', () => {
        service['isShowingAnswers'] = true;
        spyOn(service, 'getGradeCounts').and.returnValue(gradeCount);
        expect(service.getLAQData()).toEqual([0, 0, 0]);
    });

    it('should return a list of the grades count when isGameover is true', () => {
        spyOn(service, 'isGameOver').and.returnValue(true);
        spyOn(service, 'getQuestionIndex').and.returnValue(0);
        service['finalGradeCount'] = gradeCountList;
        expect(service['getValues'](gradeCount)).toEqual([0, 0, 0]);
        expect(service.getLAQData()).toEqual([0, 0, 0]);
    });

    it('should return a list of the grades count when isShowingAnswers is false', () => {
        service['isShowingAnswers'] = false;
        service['hasInteracted'] = 1;
        service['hasNotInteracted'] = 1;
        expect(service.getLAQData()).toEqual([1, 1]);
    });

    it('should update hasInteracted and hasNotInteracted on sendInteracted Event', () => {
        const sub = service.onChartUpdate().subscribe(() => {
            return;
        });
        emulateServerEvent(BarChartEvent.SendInteracted, { interacted: 1, notInteracted: 0 });
        sub.unsubscribe();
        expect(service['hasInteracted']).toEqual(1);
        expect(service['hasNotInteracted']).toEqual(0);
    });

    it('should put isShowingAnswers to false on isAnswering event', () => {
        const sub = service.onChartUpdate().subscribe(() => {
            return;
        });
        emulateServerEvent(GameEvent.IsAnswering);
        sub.unsubscribe();
        expect(service['isShowingAnswers']).toEqual(false);
    });

    it('should put isShowingAnswers to true on isShowingAnswers event', () => {
        const sub = service.onChartUpdate().subscribe(() => {
            return;
        });
        emulateServerEvent(GameEvent.IsShowingAnswers);
        sub.unsubscribe();
        expect(service['isShowingAnswers']).toEqual(true);
    });

    it('should update gradeCount on sendGrades event', () => {
        const sub = service.onChartUpdate().subscribe(() => {
            return;
        });
        emulateServerEvent(BarChartEvent.SendGrades, gradeCount);
        sub.unsubscribe();
        expect(service['gradeCount']).toEqual(gradeCount);
    });
});

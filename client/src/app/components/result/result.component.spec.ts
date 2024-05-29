import { HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { AppMaterialModule } from '@app/modules/material.module';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { StatsService } from '@app/services/stats/stats.service';
import { ChoiceVote, GameResults } from '@common/events';
import { Subject } from 'rxjs';
import { ResultComponent } from './result.component';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { enumValues } from '@app/utils/enum-values';
import { Swipe } from '@common/constants';

/* eslint max-classes-per-file: ["off"] --
 * Explanation: we're mocking sub components
 */

@Component({ selector: 'app-bar-chart' })
class BarChartComponent {}

@Component({ selector: 'app-timer' })
class TimerComponent {}

@Component({ selector: 'app-leaderboard' })
class LeaderboardComponent {}

describe('ResultPageComponent', () => {
    let component: ResultComponent;
    let fixture: ComponentFixture<ResultComponent>;
    let organiserServiceSpy: jasmine.SpyObj<OrganiserService>;
    let stats: jasmine.SpyObj<StatsService>;
    let gameLogicSpy: jasmine.SpyObj<GameLogicService>;

    beforeEach(async () => {
        gameLogicSpy = jasmine.createSpyObj<GameLogicService>('GameLogicService', ['getState']);
        organiserServiceSpy = jasmine.createSpyObj('OrganiserService', ['nextQuestion'], { userVote: new Subject<void>() });
        stats = jasmine.createSpyObj('StatsService', [
            'getSelectedChoices',
            'getQuestionName',
            'isGameOver',
            'getGameResults',
            'getGameCompletion',
            'slideChart',
        ]);

        await TestBed.configureTestingModule({
            declarations: [BarChartComponent, TimerComponent, LeaderboardComponent, ResultComponent],
            imports: [HttpClientModule, MatIconModule, AppMaterialModule],
            providers: [
                { provide: OrganiserService, useValue: organiserServiceSpy },
                { provide: StatsService, useValue: stats },
                { provide: GameLogicService, useValue: gameLogicSpy },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ResultComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('passQuestion should call organiser service', () => {
        organiserServiceSpy.nextQuestion.and.returnValue();
        component.passQuestion();
        expect(organiserServiceSpy.nextQuestion).toHaveBeenCalled();
    });

    it('should be able to go to next question / game over if showing answers', () => {
        enumValues(PlayState).forEach((state) => {
            gameLogicSpy.getState.and.returnValue(state);
            expect(component.canGoToNextQuestion()).toEqual(state === PlayState.ShowingAnswers);
        });
    });

    it('getSelectedChocies should return seletected choice from stat service', () => {
        const fakeChoices = [{} as ChoiceVote, {} as ChoiceVote];
        stats.getSelectedChoices.and.returnValue(fakeChoices);
        expect(component.getSelectedChoices()).toEqual(fakeChoices);
    });

    it('getQuestionName should return value given by statService', () => {
        const title = 'allo';
        stats.questionName = title;
        expect(component.getQuestionName()).toEqual(title);
    });

    it('getChoices should return a list of names', () => {
        const fakeChoices = [{ name: 'a' } as ChoiceVote, { name: 'b' } as ChoiceVote];
        stats.getSelectedChoices.and.returnValue(fakeChoices);
        expect(component.getChoices()).toEqual(['a', 'b']);
    });

    it('isGameOver should return result given by statService', () => {
        stats.isGameOver.and.returnValue(true);
        expect(component.isGameOver()).toBeTrue();
    });

    it('getGameResult should return results givent by statsService', () => {
        const fakeResults = {} as GameResults;
        stats.getGameResults.and.returnValue(fakeResults);
        expect(component.getGameResults()).toEqual(fakeResults);
    });

    it('nextQuestion and pastQuestion should call statsService with 1 and -1 respectively', () => {
        stats.slideChart.and.returnValue();
        component.nextQuestion();
        expect(stats.slideChart).toHaveBeenCalledWith(Swipe.Right);
        component.pastQuestion();
        expect(stats.slideChart).toHaveBeenCalledWith(Swipe.Left);
    });

    it('nextQuestion button should change text when its last question', () => {
        [
            { val: 0.1, str: 'Prochaine question' },
            { val: 1.0, str: 'Voir les résultats' },
        ].forEach((obj) => {
            stats.getGameCompletion.and.returnValue(obj.val);
            expect(component.getButtonText()).toEqual(obj.str);
        });
    });
});

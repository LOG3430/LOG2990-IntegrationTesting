/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameLogicService, PlayState } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { StatsService } from '@app/services/stats/stats.service';

import { Component } from '@angular/core';
import { AppMaterialModule } from '@app/modules/material.module';
import { TimerComponent } from './timer.component';
import { enumValues } from '@app/utils/enum-values';

@Component({ selector: 'app-remaining-time' })
class RemainingTimeComponent {}

describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;
    let statsSpy: jasmine.SpyObj<StatsService>;
    let gameSpy: jasmine.SpyObj<GameService>;
    let gameLogicSpy: jasmine.SpyObj<GameLogicService>;

    beforeEach(() => {
        statsSpy = jasmine.createSpyObj<StatsService>('StatsService', ['getHowManySubmitted']);
        gameSpy = jasmine.createSpyObj<GameService>('GameService', ['getPlayers', 'isOrganiser']);
        gameLogicSpy = jasmine.createSpyObj<GameLogicService>('GameLogicService', ['isPaused', 'goPanic', 'pause', 'canPanic', 'getState']);
        gameSpy.getPlayers.and.returnValue(['a', 'b', 'c', 'd']);
        statsSpy.getHowManySubmitted.and.returnValue(1);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [TimerComponent, RemainingTimeComponent],
            providers: [
                { provide: StatsService, useValue: statsSpy },
                { provide: GameService, useValue: gameSpy },
                { provide: GameLogicService, useValue: gameLogicSpy },
            ],
        });
        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call getHowManySubmitted method from statsService', () => {
        component.howManyConfirmed();
        component.howManyConfirmed();
        expect(statsSpy.getHowManySubmitted).toHaveBeenCalled();
    });

    it('should show controls when is organiser and in answering state', () => {
        enumValues(PlayState).forEach((state) => {
            [false, true].forEach((isOrg) => {
                gameLogicSpy.getState.and.returnValue(state);
                gameSpy.isOrganiser.and.returnValue(isOrg);
                expect(component.canShowControls()).toBe(isOrg && state === PlayState.Answering);
            });
        });
    });

    it('should change value of pauseTooltip() to reflect action', () => {
        gameLogicSpy.isPaused.and.returnValue(true);
        expect(component.pauseTooltip()).toEqual('Reprendre');
        gameLogicSpy.isPaused.and.returnValue(false);
        expect(component.pauseTooltip()).toEqual('Pause');
    });

    it('should give the proper number of players', () => {
        expect(component.totalPlayers()).toEqual(4);
        expect(component.totalPlayers()).toEqual(4);
    });

    it('should give the proper percentage of submitted answers', () => {
        expect(component.completion()).toEqual(25);
        expect(component.completion()).toEqual(25);
    });

    it('pause should pause in service', () => {
        component.pause();
        expect(gameLogicSpy.pause).toHaveBeenCalled();
    });

    describe('panic fuctions', () => {
        it('goPanic should call gamelogic service to go into panic mode', () => {
            component.goPanic();
            expect(gameLogicSpy.goPanic).toHaveBeenCalled();
        });

        it('canPanic should ask service if panic mode is enabled', () => {
            component.canPanic();
            expect(gameLogicSpy.canPanic).toHaveBeenCalled();
        });
    });
});

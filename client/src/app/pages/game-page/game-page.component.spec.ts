import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService, State } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { GameType } from '@common/events';
import { of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

/* eslint max-classes-per-file: ["off"] */

@Component({ selector: 'app-waiting-area' })
class WaitingAreaComponent {}

@Component({ selector: 'app-play-area' })
class PlayAreaComponent {}

@Component({ selector: 'app-chat' })
class ChatComponent {}

@Component({ selector: 'app-header' })
class HeaderComponent {}

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameLogic: jasmine.SpyObj<GameLogicService>;
    let gameService: jasmine.SpyObj<GameService>;
    let router: Router;
    let dialog: jasmine.SpyObj<DialogService>;
    let global: jasmine.SpyObj<GlobalService>;

    beforeEach(async () => {
        gameLogic = jasmine.createSpyObj('GameLogic', ['getTime']);
        gameService = jasmine.createSpyObj('GameService', [
            'leave',
            'listenToPresentation',
            'listenToPlay',
            'listenToResult',
            'getState',
            'isOrganiser',
        ]);
        router = jasmine.createSpyObj('Router', ['navigate']);
        dialog = jasmine.createSpyObj('DialogService', ['answerDialog', 'confirmDialog']);
        gameService = jasmine.createSpyObj('GameService', [
            'leave',
            'listenToPresentation',
            'listenToPlay',
            'listenToResult',
            'getState',
            'getJoinResponse',
            'isOrganiser',
        ]);
        global = jasmine.createSpyObj('GlobalService', ['getRoute'], { router, dialog });

        gameService.getJoinResponse.and.returnValue({ success: true });

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [GamePageComponent, HeaderComponent, WaitingAreaComponent, PlayAreaComponent, ChatComponent],
            providers: [
                { provide: GameLogicService, useValue: gameLogic },
                { provide: GameService, useValue: gameService },
                { provide: GlobalService, useValue: global },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should always have a title (wait)', () => {
        expect(gameService.getJoinResponse).toBeTruthy();
        gameService.getState.and.returnValue(State.Wait);
        expect(component.getTitle()).toBe("Salle d'attente");
    });

    it('should always have a title (present)', () => {
        gameService.getState.and.returnValue(State.Present);
        expect(component.getTitle()).toBe('Salle de présentation');
    });

    it('should always have a title (play)', () => {
        gameService.getState.and.returnValue(State.Play);
        gameService.gameMode = GameType.Normal;
        [
            { val: true, str: 'Statistiques de la question' },
            { val: false, str: 'Salle de jeu' },
        ].forEach((obj) => {
            gameService.isOrganiser.and.returnValue(obj.val);
            expect(component.getTitle()).toEqual(obj.str);
        });
    });

    it('should always have a title (result)', () => {
        gameService.getState.and.returnValue(State.Result);
        expect(component.getTitle()).toBe('Résultats de la partie');
    });

    it('should always have a title (evaluation)', () => {
        gameService.getState.and.returnValue(State.Evaluation);
        expect(component.getTitle()).toBe('Évaluation des réponses');
    });

    it('getTime should return right time', () => {
        gameLogic.getTime.and.returnValue(3);
        expect(component.getTime()).toBe(3);
    });

    describe('life cycle', () => {
        it('should leave game when destroyed', () => {
            component.ngOnDestroy();
            expect(gameService.leave).toHaveBeenCalledTimes(1);
        });
    });

    describe('Leave game', () => {
        it('Canceling leave game should ignore', () => {
            dialog.confirmDialog.and.returnValue(of(false));
            component.leaveGame();
            expect(router.navigate).toHaveBeenCalledTimes(0);
        });

        it('Confirming leave game should leave', () => {
            dialog.confirmDialog.and.returnValue(of(true));
            component.leaveGame();
            expect(router.navigate).toHaveBeenCalledWith(['/home']);
        });
    });
});

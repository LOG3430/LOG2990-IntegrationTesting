import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { globalMock } from '@app/utils/global-test-helper';
import { Subject } from 'rxjs';
import { TestPageComponent } from './test-page.component';

/* eslint max-classes-per-file: ["off"] */

@Component({ selector: 'app-play-area' })
class PlayAreaComponent {}

@Component({ selector: 'app-chat' })
class ChatComponent {}

@Component({ selector: 'app-header' })
class HeaderComponent {}

describe('TestPageComponent', () => {
    let component: TestPageComponent;
    let fixture: ComponentFixture<TestPageComponent>;
    let gameLogic: jasmine.SpyObj<GameLogicService>;
    let gameService: jasmine.SpyObj<GameService>;
    let router: jasmine.SpyObj<Router>;

    const gameOver = new Subject<void>();

    beforeEach(() => {
        gameLogic = jasmine.createSpyObj('GameLogic', ['onGameOver']);
        gameLogic.onGameOver.and.returnValue(gameOver);

        gameService = jasmine.createSpyObj('GameService', ['leave', 'getJoinResponse']);

        let global: GlobalService;
        [global, , , router] = globalMock();
        gameService.getJoinResponse.and.returnValue({ success: true });

        TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [TestPageComponent, PlayAreaComponent, HeaderComponent, ChatComponent],
            providers: [
                { provide: GameLogicService, useValue: gameLogic },
                { provide: GameService, useValue: gameService },
                { provide: GlobalService, useValue: global },
            ],
        });

        fixture = TestBed.createComponent(TestPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should go to game creation page on game over', () => {
        expect(router.navigate).not.toHaveBeenCalled();
        gameOver.next();
        expect(router.navigate).toHaveBeenCalledOnceWith(['/party/create']);
    });

    it('should leave the game on destruction', () => {
        component.ngOnDestroy();
        expect(gameService.leave).toHaveBeenCalledTimes(1);
    });
});

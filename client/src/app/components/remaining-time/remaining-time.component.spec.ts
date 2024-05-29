import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RemainingTimeComponent } from './remaining-time.component';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';

describe('RemainingTimeComponent', () => {
    let component: RemainingTimeComponent;
    let fixture: ComponentFixture<RemainingTimeComponent>;
    let gameLogic: jasmine.SpyObj<GameLogicService>;

    beforeEach(() => {
        gameLogic = jasmine.createSpyObj<GameLogicService>('GameLogicService', ['getTime', 'isPanicking']);

        TestBed.configureTestingModule({
            providers: [{ provide: GameLogicService, useValue: gameLogic }],
            declarations: [RemainingTimeComponent],
        });

        fixture = TestBed.createComponent(RemainingTimeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get time from gameLogicService', () => {
        expect(gameLogic.getTime()).toEqual(component.getTime());
    });

    it('should ask game logic if is panicking', () => {
        [true, false].forEach((v) => {
            gameLogic.isPanicking.and.returnValue(v);
            expect(component.isPanicking()).toBe(v);
        });
    });
});

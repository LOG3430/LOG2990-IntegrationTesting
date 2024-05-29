import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { GameLogicService } from '@app/services/game-logic/game-logic.service';
import { GameInfo, GameService } from '@app/services/game/game.service';
import { GamePresentationComponent } from './game-presentation.component';

describe('GamePresentationComponent', () => {
    let component: GamePresentationComponent;
    let fixture: ComponentFixture<GamePresentationComponent>;
    let gameLogicSpyService: jasmine.SpyObj<GameLogicService>;
    let gameService: jasmine.SpyObj<GameService>;

    beforeEach(() => {
        gameLogicSpyService = jasmine.createSpyObj('GameLogicService', ['getTitle', 'getTime']);
        gameService = jasmine.createSpyObj('GameService', ['getGameInfo']);
        gameService.getGameInfo.and.returnValue({ title: '' } as GameInfo);

        TestBed.configureTestingModule({
            imports: [MatDialogModule],
            declarations: [GamePresentationComponent],
            providers: [
                { provide: GameLogicService, useValue: gameLogicSpyService },
                { provide: GameService, useValue: gameService },
            ],
        });
        fixture = TestBed.createComponent(GamePresentationComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return title', () => {
        const title = 'abc';
        gameService.getGameInfo.and.returnValue({ title } as GameInfo);
        expect(component.getQuizTitle()).toBe(title);
    });
});

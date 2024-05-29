import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { GameService } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { of } from 'rxjs';
import { WaitingAreaComponent } from './waiting-area.component';

describe('WaitingAreaComponent', () => {
    let component: WaitingAreaComponent;
    let fixture: ComponentFixture<WaitingAreaComponent>;
    let organiserServiceSpy: jasmine.SpyObj<OrganiserService>;
    let gameService: jasmine.SpyObj<GameService>;

    beforeEach(async () => {
        organiserServiceSpy = jasmine.createSpyObj('OrganiserService', [
            'startGame',
            'nextQuestion',
            'goToGameResults',
            'kickoutPlayer',
            'toggleLockGame',
        ]);
        gameService = jasmine.createSpyObj('GameService', ['getPlayers', 'isMe', 'isOrganiser', 'gameCode']);
        gameService.getPlayers.and.returnValue([]);

        await TestBed.configureTestingModule({
            imports: [MatDialogModule, MatIconModule],
            declarations: [WaitingAreaComponent],
            providers: [
                { provide: OrganiserService, useValue: organiserServiceSpy },
                { provide: GameService, useValue: gameService },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(WaitingAreaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should tell if we are the organiser', () => {
        [false, true].forEach((v) => {
            gameService.isOrganiser.and.returnValue(v);
            expect(component.isOrganiser()).toBe(v);
        });
    });

    it('should tell the game code', () => {
        const room = 'abcd';
        gameService.gameCode.and.returnValue(room);
        expect(component.gameCode()).toBe(room);
    });

    describe('can start', () => {
        beforeEach(() => {
            gameService.isOrganiser.and.returnValue(true);

            organiserServiceSpy.toggleLockGame.and.returnValue(of(false));
            component.toggleLock();

            gameService.getPlayers.and.returnValue(['bla']);
        });

        it('should be true when isOrganiser, is locked and has at least one player', () => {
            expect(component.canStart()).toBeTrue();
        });

        it('should be false when not isOrganiser', () => {
            gameService.isOrganiser.and.returnValue(false);
            expect(component.canStart()).toBeFalse();
        });

        it('should be false when unlocked', () => {
            organiserServiceSpy.toggleLockGame.and.returnValue(of(true));
            component.toggleLock();

            expect(component.canStart()).toBeFalse();
        });

        it('should be false when no players', () => {
            gameService.getPlayers.and.returnValue([]);
            expect(component.canStart()).toBeFalse();
        });
    });

    it('should send start game event', () => {
        component.startGame();
        expect(organiserServiceSpy.startGame).toHaveBeenCalledTimes(1);
    });

    it('should toggle lock state', () => {
        expect(component.isUnlocked()).toBeTrue();
        organiserServiceSpy.toggleLockGame.and.returnValue(of(false));
        component.toggleLock();
        expect(component.isUnlocked()).toBeFalse();
        organiserServiceSpy.toggleLockGame.and.returnValue(of(true));
        component.toggleLock();
        expect(component.isUnlocked()).toBeTrue();
    });

    it('should toggle Tooltip string', () => {
        expect(component.isUnlocked()).toBeTrue();
        organiserServiceSpy.toggleLockGame.and.returnValue(of(false));
        component.toggleLock();
        expect(component.getTooltip()).toEqual('Déverouiller la salle');
        organiserServiceSpy.toggleLockGame.and.returnValue(of(true));
        component.toggleLock();
        expect(component.getTooltip()).toEqual('Vérouiller la salle');
    });

    it('should kickout', () => {
        const name = 'abc';
        component.ban(name);
        expect(organiserServiceSpy.kickoutPlayer).toHaveBeenCalledOnceWith(name);
    });

    describe('player list', () => {
        it('should provide the player list', () => {
            const players = ['p1', 'p1'];
            gameService.getPlayers.and.returnValue(players);
            expect(component.getPlayers()).toEqual(players);
            expect(gameService.getPlayers).toHaveBeenCalled();
        });

        it('should ask the game service if a player is self', () => {
            [true, false].forEach((v) => {
                const name = 'abc';
                gameService.isMe.and.returnValue(v);
                expect(component.isMe(name)).toBe(v);
                expect(gameService.isMe).toHaveBeenCalledOnceWith(name);
                gameService.isMe.calls.reset();
            });
        });
    });
});

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Sort } from '@angular/material/sort';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { GameService, State } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { enumValues } from '@app/utils/enum-values';
import { LeaderboardEntry, PlayerState } from '@common/events';
import { Subject } from 'rxjs';
import { LeaderboardComponent } from './leaderboard.component';

const p1: LeaderboardEntry = { username: 'a', points: 10, nBonus: 0, state: PlayerState.Submitted, isMuted: false };
const p2: LeaderboardEntry = { username: 'b', points: 20, nBonus: 1, state: PlayerState.NoAction, isMuted: false };
const p3: LeaderboardEntry = { username: 'c', points: 10, nBonus: 1, state: PlayerState.Left, isMuted: false };

describe('LeaderboardComponent', () => {
    let component: LeaderboardComponent;
    let fixture: ComponentFixture<LeaderboardComponent>;
    let gameSpy: jasmine.SpyObj<GameService>;
    let organiserSpy: jasmine.SpyObj<OrganiserService>;
    let leaderboardSubject: Subject<LeaderboardEntry[]>;

    beforeEach(() => {
        gameSpy = jasmine.createSpyObj<GameService>('GameService', ['getPlayers', 'onLeaderboard', 'isOrganiser', 'getState']);
        organiserSpy = jasmine.createSpyObj<OrganiserService>('OrganiserService', ['mutePlayer']);

        gameSpy.getPlayers.and.returnValue(['a', 'b', 'c']);
        gameSpy.onLeaderboard.and.returnValue((leaderboardSubject = new Subject()));
        gameSpy.isOrganiser.and.returnValue(true);

        TestBed.configureTestingModule({
            declarations: [LeaderboardComponent],
            imports: [AppMaterialModule, NoopAnimationsModule, HttpClientTestingModule],
            providers: [
                { provide: GameService, useValue: gameSpy },
                { provide: OrganiserService, useValue: organiserSpy },
            ],
        });

        fixture = TestBed.createComponent(LeaderboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should tell if an entry is a dead player', () => {
        expect(component.isDead({ state: PlayerState.Left } as LeaderboardEntry)).toBeTrue();
        expect(component.isDead({ state: PlayerState.NoAction } as LeaderboardEntry)).toBeFalse();
    });

    it('should give a color for any player state', () => {
        enumValues(PlayerState).forEach((state) => {
            expect(component.getColor(state)).toBeDefined();
        });
    });

    it('should give a right tooltip for any player state', () => {
        enumValues(PlayerState).forEach((element) => {
            expect(component.getTooltip(element)).toBeDefined();
        });
    });

    it('should mute players', () => {
        component.mutePlayer('p');
        expect(organiserSpy.mutePlayer).toHaveBeenCalledOnceWith('p');
    });

    it('should tell if is organiser', () => {
        [true, false].forEach((v) => {
            gameSpy.isOrganiser.and.returnValue(v);
            expect(component.isOrganiser()).toBe(v);
        });
    });

    it('should update displayed columns', () => {
        gameSpy.getState.and.returnValue(State.Result);
        gameSpy.isOrganiser.and.returnValue(false);
        expect(component.getColumns()).toEqual(jasmine.arrayContaining(['username', 'points', 'nBonus']));

        gameSpy.getState.and.returnValue(State.Play);
        expect(component.getColumns()).toEqual(jasmine.arrayContaining(['username', 'points', 'nBonus', 'state']));

        gameSpy.isOrganiser.and.returnValue(true);
        expect(component.getColumns()).toEqual(jasmine.arrayContaining(['username', 'points', 'nBonus', 'isMuted', 'state']));
    });

    describe('sorting', () => {
        beforeEach(() => {
            leaderboardSubject.next([p1, p2, p3]);
        });

        it('should order players by points and username in case of collision initially', () => {
            expect(component.leaderboard).toEqual([p2, p1, p3]);
        });

        describe('changing sort key', () => {
            interface TestCase {
                sort: Sort;
                result: LeaderboardEntry[];
            }

            const cases: TestCase[] = [
                {
                    sort: { active: 'username', direction: 'asc' },
                    result: [p1, p2, p3],
                },
                {
                    sort: { active: 'username', direction: 'desc' },
                    result: [p3, p2, p1],
                },
                {
                    sort: { active: 'points', direction: 'asc' },
                    result: [p1, p3, p2],
                },
                {
                    sort: { active: 'points', direction: 'desc' },
                    result: [p2, p1, p3],
                },
                {
                    sort: { active: 'nBonus', direction: 'asc' },
                    result: [p1, p2, p3],
                },
                {
                    sort: { active: 'nBonus', direction: 'desc' },
                    result: [p2, p3, p1],
                },
                {
                    sort: { active: 'state', direction: 'asc' },
                    result: [p2, p1, p3],
                },
                {
                    sort: { active: 'state', direction: 'desc' },
                    result: [p3, p1, p2],
                },
            ];

            cases.forEach((c) => {
                it(`should work with ${c.sort.active} - ${c.sort.direction}`, () => {
                    component.onSort(c.sort);
                    expect(component.leaderboard).toEqual(c.result);
                });
            });
        });
    });
});

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort, SortDirection } from '@angular/material/sort';
import { GameService, State } from '@app/services/game/game.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { LeaderboardEntry, PlayerState } from '@common/events';
import { Subscription } from 'rxjs';

type ComparisonVariant = (dir: SortDirection) => Comparison;
type Comparison = (a: LeaderboardEntry, b: LeaderboardEntry) => number;

const backupComp: Comparison = (a: LeaderboardEntry, b: LeaderboardEntry) => {
    return a.username.localeCompare(b.username);
};

const genericComp = (prop: 'points' | 'nBonus' | 'state', dir: SortDirection) => {
    return (a: LeaderboardEntry, b: LeaderboardEntry) => {
        const diff: number = dir === 'asc' ? a[prop] - b[prop] : b[prop] - a[prop];
        return diff === 0 ? backupComp(a, b) : diff;
    };
};

const comparisons: Record<string, ComparisonVariant> = {
    username: (dir: SortDirection) => (dir === 'asc' ? backupComp : (a, b) => backupComp(b, a)),
    points: (dir: SortDirection) => genericComp('points', dir),
    nBonus: (dir: SortDirection) => genericComp('nBonus', dir),
    state: (dir: SortDirection) => genericComp('state', dir),
};

@Component({
    selector: 'app-leaderboard',
    templateUrl: './leaderboard.component.html',
    styleUrls: ['./leaderboard.component.scss'],
})
export class LeaderboardComponent implements OnInit, OnDestroy {
    leaderboard: LeaderboardEntry[] = [];

    private displayedColumns: (keyof LeaderboardEntry)[] = [];
    private sort: Sort = { active: 'points', direction: 'desc' };
    private subscription: Subscription;

    constructor(
        private gameService: GameService,
        private organiserService: OrganiserService,
    ) {}

    ngOnInit() {
        this.setLeaderboard(
            this.gameService.getPlayers().map((p) => {
                return { username: p, points: 0, nBonus: 0, state: PlayerState.NoAction, isMuted: false };
            }),
        );

        this.subscription = this.gameService.onLeaderboard().subscribe((leaderboard: LeaderboardEntry[]) => {
            this.setLeaderboard(leaderboard);
        });
    }

    ngOnDestroy() {
        this.subscription?.unsubscribe();
    }

    onSort(sort: Sort): void {
        this.sort = sort;
        this.orderPlayers();
    }

    isDead(entry: LeaderboardEntry): boolean {
        return entry.state === PlayerState.Left;
    }

    isOrganiser(): boolean {
        return this.gameService.isOrganiser();
    }

    mutePlayer(username: string): void {
        this.organiserService.mutePlayer(username);
    }

    getColor(state: PlayerState): string {
        switch (state) {
            case PlayerState.NoAction:
                return 'red';
            case PlayerState.Interacted:
                return 'yellow';
            case PlayerState.Submitted:
                return 'green';
            case PlayerState.Left:
                return 'black';
        }
    }

    getColumns(): (keyof LeaderboardEntry)[] {
        this.displayedColumns = ['username', 'points', 'nBonus'];

        if (!this.isInResultPage()) {
            this.displayedColumns.push('state');
            if (this.isOrganiser()) {
                this.displayedColumns.push('isMuted');
            }
        }

        return this.displayedColumns;
    }

    getTooltip(state: PlayerState): string {
        switch (state) {
            case PlayerState.NoAction:
                return 'Aucune interaction';
            case PlayerState.Interacted:
                return 'A intéragi';
            case PlayerState.Submitted:
                return 'Réponse soumise';
            case PlayerState.Left:
                return 'A abandonné';
        }
    }

    private isInResultPage(): boolean {
        return this.gameService.getState() === State.Result;
    }

    private setLeaderboard(leaderboard: LeaderboardEntry[]): void {
        this.leaderboard = leaderboard;
        this.orderPlayers();
    }

    private orderPlayers(): void {
        this.leaderboard = this.leaderboard.slice().sort(comparisons[this.sort.active](this.sort.direction));
    }
}

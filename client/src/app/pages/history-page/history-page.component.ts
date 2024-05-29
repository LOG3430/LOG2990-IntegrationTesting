import { Component, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { DialogService } from '@app/services/dialog/dialog.service';
import { HistoryService } from '@app/services/history/history.service';
import { History } from '@common/history';

@Component({
    selector: 'app-history-page',
    templateUrl: './history-page.component.html',
    styleUrls: ['./history-page.component.scss'],
})
export class HistoryPageComponent implements OnInit {
    displayedColumns: string[] = ['gameName', 'startDate', 'numberPlayerBeginning', 'highestScore'];
    history: History[] = [];
    private sort: Sort = { active: 'startDate', direction: 'desc' };

    constructor(
        private readonly historyService: HistoryService,
        private readonly dialogService: DialogService,
    ) {}

    ngOnInit(): void {
        this.refreshHistory(true);
    }

    onSortData(sort: Sort): void {
        const data = this.history.slice();
        if (!sort.active || sort.direction === '') {
            this.history = data;
            return;
        }

        this.history = data.sort((a, b) => {
            const isAsc = sort.direction === 'asc';
            if (sort.active === 'gameName') return this.compareByTitle(a, b, isAsc);
            return this.compareByDate(a, b, isAsc);
        });
    }

    deleteHistory(): void {
        this.dialogService.confirmDialog("Êtes-vous sur de vouloir supprimer l'historique?").subscribe((confirm: boolean) => {
            if (confirm)
                this.historyService.deleteHistory().subscribe((res: boolean) => {
                    const confirmationText = res ? "L'historique a été supprimé avec succès" : 'Une erreur est survenue';
                    this.dialogService.alert(confirmationText);
                    this.refreshHistory(false);
                });
        });
    }

    private compareByTitle(a: History, b: History, isAsc: boolean): number {
        const comp = isAsc === true ? a.gameName.localeCompare(b.gameName) : b.gameName.localeCompare(a.gameName);
        return comp === 0 ? this.compareByDate(a, b, isAsc) : comp;
    }

    private compareByDate(a: History, b: History, isAsc: boolean): number {
        return isAsc === true ? a.startDate.localeCompare(b.startDate) : b.startDate.localeCompare(a.startDate);
    }

    private refreshHistory(showAlert: boolean): void {
        this.historyService.getHistory().subscribe((history: History[]) => {
            if (history.length === 0 && showAlert) {
                this.dialogService.alert('Aucun jeu-questionnaire complété');
            }
            this.history = history;
            this.onSortData(this.sort);
        });
    }
}

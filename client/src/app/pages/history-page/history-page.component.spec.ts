import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Sort } from '@angular/material/sort';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from '@app/components/header/header.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { DateFormatterPipe } from '@app/pipes/date-formatter/date-formatter.pipe';
import { DialogService } from '@app/services/dialog/dialog.service';
import { HistoryService } from '@app/services/history/history.service';
import { History } from '@common/history';
import { of } from 'rxjs';
import { HistoryPageComponent } from './history-page.component';

const g1: History = { gameName: 'a', startDate: '2024-01-01 00:00:00', numberPlayerBeginning: 5, highestScore: 100 };
const g2: History = { gameName: 'b', startDate: '2020-01-01 00:00:00', numberPlayerBeginning: 7, highestScore: 90 };
const g3: History = { gameName: 'b', startDate: '2000-01-01 00:00:00', numberPlayerBeginning: 6, highestScore: 110 };
const history = [g1, g2, g3];

interface TestCase {
    sort: Sort;
    result: History[];
}

describe('HistoryPageComponent', () => {
    let component: HistoryPageComponent;
    let fixture: ComponentFixture<HistoryPageComponent>;
    let historySpy: jasmine.SpyObj<HistoryService>;
    let dialogSpy: jasmine.SpyObj<DialogService>;

    beforeEach(() => {
        historySpy = jasmine.createSpyObj<HistoryService>('HistoryService', ['getHistory', 'deleteHistory']);
        dialogSpy = jasmine.createSpyObj<DialogService>('DialogService', ['alert', 'confirmDialog']);
        historySpy.getHistory.and.returnValue(of(history));
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, FormsModule, ReactiveFormsModule, NoopAnimationsModule, HttpClientTestingModule],
            declarations: [HistoryPageComponent, HeaderComponent, DateFormatterPipe],
            providers: [
                { provide: HistoryService, useValue: historySpy },
                { provide: DialogService, useValue: dialogSpy },
            ],
        });
        fixture = TestBed.createComponent(HistoryPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should get history on init', () => {
        expect(historySpy.getHistory).toHaveBeenCalledTimes(1);
        expect(component.history).toEqual(history);
        expect(component.history).toEqual(history);
    });

    it('should delete history', () => {
        dialogSpy.confirmDialog.and.returnValue(of(true));
        historySpy.deleteHistory.and.returnValue(of(true));
        component.deleteHistory();
        expect(dialogSpy.alert).toHaveBeenCalledWith("L'historique a été supprimé avec succès");
        expect(historySpy.deleteHistory).toHaveBeenCalledTimes(1);
    });

    it('should show different text if history delete failed', () => {
        dialogSpy.confirmDialog.and.returnValue(of(true));
        historySpy.deleteHistory.and.returnValue(of(false));
        component.deleteHistory();
        expect(dialogSpy.alert).toHaveBeenCalledWith('Une erreur est survenue');
        expect(historySpy.deleteHistory).toHaveBeenCalledTimes(1);
    });

    it('should handle empty history', () => {
        historySpy.getHistory.and.returnValue(of([]));
        component.ngOnInit();
        expect(dialogSpy.alert).toHaveBeenCalledWith('Aucun jeu-questionnaire complété');
    });

    describe('changing sort key', () => {
        const cases: TestCase[] = [
            {
                sort: { active: 'gameName', direction: 'asc' },
                result: [g1, g3, g2],
            },
            {
                sort: { active: 'gameName', direction: 'desc' },
                result: [g2, g3, g1],
            },
            {
                sort: { active: 'startDate', direction: 'asc' },
                result: [g3, g2, g1],
            },
            {
                sort: { active: 'startDate', direction: 'desc' },
                result: [g1, g2, g3],
            },
            {
                sort: { active: 'gameName', direction: '' },
                result: [g1, g2, g3],
            },
        ];

        cases.forEach((c) => {
            it(`should work with ${c.sort.active} - ${c.sort.direction}`, () => {
                component.onSortData(c.sort);
                expect(component.history).toEqual(c.result);
            });
        });
    });
});

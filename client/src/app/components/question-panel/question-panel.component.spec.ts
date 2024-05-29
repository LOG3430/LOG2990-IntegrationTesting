import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { QuestionPanelComponent } from './question-panel.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Question } from '@common/question';

describe('QuestionPanelComponent', () => {
    let component: QuestionPanelComponent;
    let fixture: ComponentFixture<QuestionPanelComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule],
            declarations: [QuestionPanelComponent],
        });
        fixture = TestBed.createComponent(QuestionPanelComponent);
        component = fixture.componentInstance;

        component.question = { text: '', choices: [] } as unknown as Question;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

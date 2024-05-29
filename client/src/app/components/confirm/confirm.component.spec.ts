import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { ConfirmComponent } from './confirm.component';

describe('ConfirmLeaveComponent', () => {
    let component: ConfirmComponent;
    let fixture: ComponentFixture<ConfirmComponent>;
    let dialogRef: MatDialogRef<ConfirmComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule],
            declarations: [ConfirmComponent],
            providers: [
                {
                    provide: MatDialogRef<ConfirmComponent>,
                    useFactory: () => {
                        dialogRef = TestBed.inject(MatDialog).open(ConfirmComponent);
                        return dialogRef;
                    },
                },
                { provide: MAT_DIALOG_DATA, useValue: 'hello' },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(ConfirmComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', async () => {
        expect(component).toBeTruthy();
    });
});

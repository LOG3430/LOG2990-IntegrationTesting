import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule } from '@app/modules/material.module';
import { PasswordDialogComponent } from './password-dialog.component';

describe('PasswordDialogComponent', () => {
    let component: PasswordDialogComponent;
    let fixture: ComponentFixture<PasswordDialogComponent>;
    let dialogRef: MatDialogRef<PasswordDialogComponent, string>;

    const adminPassword = 'log2990-104';
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule, FormsModule],
            declarations: [PasswordDialogComponent],
            providers: [
                {
                    provide: MatDialogRef<PasswordDialogComponent, string>,
                    useFactory: () => {
                        dialogRef = TestBed.inject(MatDialog).open(PasswordDialogComponent);
                        return dialogRef;
                    },
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: {
                        password: adminPassword,
                    },
                },
            ],
        });
        fixture = TestBed.createComponent(PasswordDialogComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should close when button is clicked', () => {
        spyOn(component, 'onNoClick').and.callThrough();
        const button = fixture.debugElement.query(By.css('button[mat-raised-button]')).nativeElement;
        button.click();
        expect(component.onNoClick).toHaveBeenCalled();
    });

    it('should confirm when button is clicked', () => {
        spyOn(component, 'confirm').and.callThrough();
        spyOn(dialogRef, 'close').and.callThrough();
        component.confirm();
        expect(dialogRef.close).toHaveBeenCalledWith(adminPassword);
        expect(component.confirm).toHaveBeenCalled();
    });
});

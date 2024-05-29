import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
    let component: AlertComponent;
    let fixture: ComponentFixture<AlertComponent>;
    let dialogRef: MatDialogRef<AlertComponent, void>;
    const router: Router = { url: 'some place' } as Router;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule],
            declarations: [AlertComponent],
            providers: [
                {
                    provide: MatDialogRef<AlertComponent, void>,
                    useFactory: () => {
                        dialogRef = TestBed.inject(MatDialog).open(AlertComponent);
                        return dialogRef;
                    },
                },
                { provide: Router, useValue: router },
                { provide: MAT_DIALOG_DATA, useValue: 'hello' },
            ],
        });

        fixture = TestBed.createComponent(AlertComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it("Should be fetch the router's url", () => {
        expect(component.currentUrl()).toEqual(router.url);
    });

    it('Should close the dialog on close()', () => {
        let closed = false;
        dialogRef.beforeClosed().subscribe(() => (closed = true));

        fixture.debugElement.query(By.css('button')).nativeElement.click();
        expect(closed).toBeTrue();
    });
});

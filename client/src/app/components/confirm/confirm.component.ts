import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-confirm',
    templateUrl: './confirm.component.html',
    styleUrls: ['./confirm.component.scss'],
})
export class ConfirmComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmComponent, boolean>,
        @Inject(MAT_DIALOG_DATA) public message: string,
    ) {}

    confirm(): boolean {
        return true;
    }

    cancel(): boolean {
        return false;
    }
}

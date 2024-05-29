import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

interface DialogData {
    password: string;
}

@Component({
    selector: 'app-password-dialog',
    templateUrl: './password-dialog.component.html',
    styleUrls: ['./password-dialog.component.scss'],
})
export class PasswordDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<PasswordDialogComponent, string>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) {}

    onNoClick(): void {
        this.dialogRef.close();
    }

    confirm(): void {
        this.dialogRef.close(this.data.password);
    }
}

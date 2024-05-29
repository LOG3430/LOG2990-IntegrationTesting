import { Inject, Component } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
    selector: 'app-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
})
export class AlertComponent {
    constructor(
        private dialogRef: MatDialogRef<AlertComponent, void>,
        private router: Router,
        @Inject(MAT_DIALOG_DATA) public message: string,
    ) {}

    close(): void {
        this.dialogRef.close();
    }

    currentUrl(): string {
        return this.router.url;
    }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AdminService } from '@app/services/admin/admin.service';

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    constructor(
        private admin: AdminService,
        private router: Router,
    ) {}

    verifyAdmin(): void {
        this.admin.verifyDialog().subscribe((res: boolean) => {
            if (res) this.router.navigate(['/admin']);
        });
    }
}

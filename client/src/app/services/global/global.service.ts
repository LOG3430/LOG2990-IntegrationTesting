import { Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';

@Injectable({
    providedIn: 'root',
})
export class GlobalService {
    constructor(
        public dialog: DialogService,
        public router: Router,
    ) {}

    getRoute(): ActivatedRoute {
        return this.getLastChild(this.router.routerState.root);
    }

    private getLastChild(root: ActivatedRoute): ActivatedRoute {
        return root.firstChild ? this.getLastChild(root.firstChild) : root;
    }
}

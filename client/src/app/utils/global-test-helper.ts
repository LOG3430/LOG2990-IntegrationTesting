import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GlobalService } from '@app/services/global/global.service';

export const globalMock = (): [jasmine.SpyObj<GlobalService>, jasmine.Spy<jasmine.Func>, jasmine.SpyObj<DialogService>, jasmine.SpyObj<Router>] => {
    const routeSpy = jasmine.createSpy();
    const route = {
        snapshot: {
            paramMap: {
                get: routeSpy,
            },
        },
    } as unknown as ActivatedRoute;

    const router = jasmine.createSpyObj('Router', ['navigate']);
    const dialog = jasmine.createSpyObj('DialogService', ['answerDialog', 'alert', 'confirmDialog']);
    const global = jasmine.createSpyObj('GlobalService', ['getRoute'], { dialog, router });
    global.getRoute.and.returnValue(route);

    return [global, routeSpy, dialog, router];
};

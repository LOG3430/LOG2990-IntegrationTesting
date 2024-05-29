import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { of } from 'rxjs';
import { RandomModeSelectorComponent } from './random-mode-selector.component';

describe('RandomModeSelectorComponent', () => {
    let component: RandomModeSelectorComponent;
    let fixture: ComponentFixture<RandomModeSelectorComponent>;

    let game: jasmine.SpyObj<GameService>;
    let global: jasmine.SpyObj<GlobalService>;
    let router: Router;
    let dialog: jasmine.SpyObj<DialogService>;

    beforeEach(() => {
        game = jasmine.createSpyObj('GameService', ['playRandomGame']);
        router = jasmine.createSpyObj('Router', ['navigate']);
        dialog = jasmine.createSpyObj('DialogService', ['alert']);
        global = jasmine.createSpyObj('GlobalService', ['getRoute'], { router, dialog });

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, NoopAnimationsModule],
            declarations: [RandomModeSelectorComponent],
            providers: [
                { provide: GameService, useValue: game },
                { provide: GlobalService, useValue: global },
            ],
        });
        fixture = TestBed.createComponent(RandomModeSelectorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to room if room created is successful', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const e = { stopPropagation: () => {} } as unknown as MouseEvent;
        game.playRandomGame.and.returnValue(of({ success: true, roomId: 'id' }));
        component.play(e);
        expect(router.navigate).toHaveBeenCalledWith(['/game', { room: 'id' }]);
        expect(dialog.alert).toHaveBeenCalledTimes(0);
    });

    it('should alert if room created is not successful', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const e = { stopPropagation: () => {} } as unknown as MouseEvent;
        ['une erreur', undefined].forEach((err) => {
            game.playRandomGame.and.returnValue(of({ success: false, error: err }));
            component.play(e);
            expect(router.navigate).toHaveBeenCalledTimes(0);
            if (!err) err = "Une erreur s'est produite";
            expect(dialog.alert).toHaveBeenCalledWith(err);
        });
    });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { AppMaterialModule } from '@app/modules/material.module';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GameService } from '@app/services/game/game.service';
import { JoinGamePageComponent } from './join-game-page.component';

describe('JoinGamePageComponent', () => {
    let component: JoinGamePageComponent;
    let fixture: ComponentFixture<JoinGamePageComponent>;

    let gameService: jasmine.SpyObj<GameService>;
    let dialogService: jasmine.SpyObj<DialogService>;
    let routerSpy: jasmine.SpyObj<Router>;

    beforeEach(() => {
        dialogService = jasmine.createSpyObj('DialogService', ['alert']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);
        gameService = jasmine.createSpyObj('GameService', ['join']);

        TestBed.configureTestingModule({
            imports: [AppMaterialModule, FormsModule, ReactiveFormsModule, NoopAnimationsModule],
            declarations: [JoinGamePageComponent, HeaderComponent],
            providers: [
                { provide: GameService, useValue: gameService },
                { provide: DialogService, useValue: dialogService },
                { provide: Router, useValue: routerSpy },
            ],
        });
        fixture = TestBed.createComponent(JoinGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call join method from the service with trimmed playerInfos', () => {
        const infos = { roomId: '  abc  ', username: '  testUser  ' };
        const trimmedInfos = { roomId: 'abc', username: 'testUser' };

        component.playerInfos = infos;
        gameService.join.and.callFake((_, callback) => callback(true));

        component.join();

        expect(gameService.join).toHaveBeenCalledOnceWith(trimmedInfos, jasmine.any(Function));
        expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/game', { room: component.playerInfos.roomId }]);
    });

    it('should not navigate if join is unsuccessful', () => {
        gameService.join.and.callFake((_, callback) => callback(false));
        component.join();
        expect(gameService.join).toHaveBeenCalledOnceWith(component.playerInfos, jasmine.any(Function));
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
});

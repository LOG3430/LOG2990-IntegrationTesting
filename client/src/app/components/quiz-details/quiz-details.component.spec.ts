import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppMaterialModule } from '@app/modules/material.module';
import { DialogService } from '@app/services/dialog/dialog.service';
import { GameService } from '@app/services/game/game.service';
import { GlobalService } from '@app/services/global/global.service';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { globalMock } from '@app/utils/global-test-helper';
import { Quiz } from '@common/quiz';
import { of } from 'rxjs';
import { QuizDetailsComponent } from './quiz-details.component';

const mockEvent = jasmine.createSpyObj('MouseEvent', ['stopPropagation']);

describe('QuizDetailsComponent', () => {
    let fixture: ComponentFixture<QuizDetailsComponent>;
    let component: QuizDetailsComponent;
    let gameSpy: jasmine.SpyObj<GameService>;
    let organiser: jasmine.SpyObj<OrganiserService>;
    let dialogSpy: jasmine.SpyObj<DialogService>;
    let routerSpy: jasmine.SpyObj<Router>;

    const serverResponse = (success: boolean, roomId?: string) => {
        return { success, roomId };
    };

    beforeEach(async () => {
        gameSpy = jasmine.createSpyObj<GameService>('GameService', ['createGame', 'testGame']);
        organiser = jasmine.createSpyObj<OrganiserService>('OrganiserService', ['startGame']);
        let global: GlobalService;
        [global, , dialogSpy, routerSpy] = globalMock();

        await TestBed.configureTestingModule({
            imports: [AppMaterialModule],
            declarations: [QuizDetailsComponent],
            providers: [
                { provide: GameService, useValue: gameSpy },
                { provide: OrganiserService, useValue: organiser },
                { provide: GlobalService, useValue: global },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(QuizDetailsComponent);
        component = fixture.componentInstance;

        spyOn(component.needsUpdate, 'emit');

        component.quiz = { id: '120' } as unknown as Quiz;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the spy injected', () => {
        expect(component['gameService']).toBe(gameSpy);
    });

    it('should redirect to /test and start the game if quiz exists', () => {
        gameSpy.testGame.and.returnValue(of(serverResponse(true, 'abc1')));
        component.testQuiz(mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(component.needsUpdate.emit).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/test', { room: 'abc1' }]);
        expect(organiser.startGame).toHaveBeenCalledTimes(1);
        expect(dialogSpy.alert).not.toHaveBeenCalled();
    });

    it("should not redirect to /test, emit update and show alert if quiz doesn't exists", () => {
        gameSpy.testGame.and.returnValue(of(serverResponse(false)));
        dialogSpy.alert.and.callThrough();
        component.testQuiz(mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(component.needsUpdate.emit).toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalled();
    });

    it('should redirect to /waiting-room/:response if request successful', () => {
        const mockResponse = '123';
        gameSpy.createGame.and.returnValue(of(serverResponse(true, mockResponse)));
        component.createGame(mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(component.needsUpdate.emit).not.toHaveBeenCalled();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/game', { room: mockResponse }]);
        expect(dialogSpy.alert).not.toHaveBeenCalled();
    });

    it('should not redirect to /waiting-room, emit update and show alert if request fails', () => {
        gameSpy.createGame.and.returnValue(of(serverResponse(false)));
        component.createGame(mockEvent);
        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(component.needsUpdate.emit).toHaveBeenCalled();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(dialogSpy.alert).toHaveBeenCalled();
    });
});

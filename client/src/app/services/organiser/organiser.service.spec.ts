import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AppMaterialModule } from '@app/modules/material.module';
import { OrganiserService } from '@app/services/organiser/organiser.service';
import { SocketService } from '@app/services/socket/socket.service';
import { EventEmitFunc, mockServerResponse, socketServiceMock } from '@app/utils/socket-test-helpers';
import { Grade, OrganiserEvent } from '@common/events';

describe('OrganiserService', () => {
    let service: OrganiserService;
    let socket: jasmine.SpyObj<SocketService>;
    let emulateServerEvent: EventEmitFunc;

    beforeEach(() => {
        [socket, emulateServerEvent] = socketServiceMock();

        TestBed.configureTestingModule({
            imports: [HttpClientModule, AppMaterialModule],
            providers: [{ provide: SocketService, useValue: socket }],
        });

        service = TestBed.inject(OrganiserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('toggle lock game', () => {
        it("should send event and return the server's answer", () => {
            [true, false].forEach((res) => {
                socket.send.and.callFake(mockServerResponse(OrganiserEvent.ToggleLock, res));
                service.toggleLockGame().subscribe((r) => {
                    expect(r).toEqual(res);
                });

                expect(socket.send).toHaveBeenCalledTimes(1);
                socket.send.calls.reset();
            });
        });
    });

    it('should send a kickout event', () => {
        const username = 'abc';
        emulateServerEvent('a');
        service.kickoutPlayer(username);
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.KickOut, username);
    });

    it('should send an event to start game', () => {
        service.startGame();
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.Start);
    });

    it('should send an event to pass to the next question', () => {
        service.nextQuestion();
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.RequestNewQuestion);
    });

    it('should send an event to end the game', () => {
        service.goToGameResults();
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.GoToGameResults);
    });

    it('endgame should send event to end the game', () => {
        service.endGame();
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.EndGame);
    });

    it('should send an event to send the grades', () => {
        const gradesList: Grade[] = [];
        gradesList.push({ username: 'a', grade: 0 });
        service.sendGrades(gradesList);
        expect(socket.send).toHaveBeenCalledWith(OrganiserEvent.sendResults, gradesList);
    });

    it('should send mute events', () => {
        service.mutePlayer('p');
        expect(socket.send).toHaveBeenCalledOnceWith(OrganiserEvent.MutePlayer, 'p');
    });
});

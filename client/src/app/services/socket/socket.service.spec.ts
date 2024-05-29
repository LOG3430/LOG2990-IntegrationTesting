import { TestBed } from '@angular/core/testing';
import { Socket } from 'socket.io-client';
import { SocketService } from './socket.service';

describe('SocketService', () => {
    let service: SocketService;
    let socketSpy: jasmine.SpyObj<Socket>;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SocketService);

        socketSpy = jasmine.createSpyObj(Socket, ['emit', 'on', 'disconnect']);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('isSocketAlive should return false if the socket is not defined', () => {
        expect(service.isSocketAlive()).toBeFalsy();
    });

    describe('when connected', () => {
        beforeEach(() => {
            service['socket'] = socketSpy;
            socketSpy.connected = true;
        });

        it('should disconnect', () => {
            service.disconnect();
            expect(socketSpy.disconnect).toHaveBeenCalled();
        });

        it('isSocketAlive should return true if the socket is still connected', () => {
            const isAlive = service.isSocketAlive();
            expect(isAlive).toBeTruthy();
        });

        it('isSocketAlive should return false if the socket is no longer connected', () => {
            socketSpy.connected = false;
            const isAlive = service.isSocketAlive();
            expect(isAlive).toBeFalsy();
        });

        it('should call socket.on with an event', () => {
            const event = 'helloWorld';
            const action = () => {}; // eslint-disable-line
            service.on(event, action);
            expect(socketSpy.on).toHaveBeenCalled();
            expect(socketSpy.on).toHaveBeenCalledWith(event, action);
        });

        it('should call emit with data when using send', () => {
            const event = 'helloWorld';
            const data = 42;
            service.send(event, data);
            expect(socketSpy.emit).toHaveBeenCalled();
            expect(socketSpy.emit).toHaveBeenCalledWith(event, data);
        });

        it('should call emit without data when using send if data is undefined', () => {
            const event = 'helloWorld';
            const data = undefined;
            service.send(event, data);
            expect(socketSpy.emit).toHaveBeenCalled();
            expect(socketSpy.emit).toHaveBeenCalledWith(event);
        });
    });
});

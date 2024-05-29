import { SocketService } from '@app/services/socket/socket.service';

export const mockServerResponse = <S>(event: string, data: S) => {
    return <T, U>(e: string, clientData: T, callback: (resp: U) => void) => {
        if (e === event) {
            callback(data as unknown as U);
        }
    };
};

export type EventEmitFunc = <T>(e: string, data?: T) => void;

export const socketServiceMock = (): [jasmine.SpyObj<SocketService>, EventEmitFunc] => {
    const service = jasmine.createSpyObj<SocketService>('SocketService', ['send', 'isSocketAlive', 'connect', 'on']);

    type EventExecutor = (data: unknown) => void;
    const eventCallbacks = new Map<string, EventExecutor[]>();
    service.on.and.callFake(<T>(e: string, callback: (data: T) => void) => {
        if (!eventCallbacks.has(e)) {
            eventCallbacks.set(e, []);
        }

        eventCallbacks.get(e)?.push(callback as (data: unknown) => void);
    });

    const emulateServerEvent = <T>(e: string, data?: T) => {
        const callbacks = eventCallbacks.get(e);
        if (callbacks) {
            callbacks.forEach((c) => c(data));
        }
    };

    return [service, emulateServerEvent];
};

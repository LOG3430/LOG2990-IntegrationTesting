import { SinonStubbedInstance, createStubInstance, spy } from 'sinon';
import { Socket, BroadcastOperator } from 'socket.io';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any --
 * Use of any because the type we want is not exposed by socketio.
 *
 * createStubInstance() does not work since BroadcastOperator is imported as type
 */
export type BroadcastOperatorMock = SinonStubbedInstance<BroadcastOperator<any, any>>;

export const broadcastMock = (): BroadcastOperatorMock => {
    const s = {
        emit: spy(),
    } as unknown as BroadcastOperatorMock;
    return s;
};

export const socketMock = (id: string): SinonStubbedInstance<Socket> => {
    const socket = createStubInstance<Socket>(Socket);
    // eslint-disable-next-line
    (socket as any).id = id;
    return socket;
};

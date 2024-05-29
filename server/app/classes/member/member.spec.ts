import { Socket } from 'socket.io';
import { Member } from './member';
import { SinonStubbedInstance, createStubInstance } from 'sinon';

describe('Member', () => {
    let socket: SinonStubbedInstance<Socket>;
    let member: Member;

    beforeEach(() => {
        socket = createStubInstance<Socket>(Socket);
        member = new Member(socket, '');
    });

    it('should be defined', () => {
        expect(member).toBeDefined();
    });

    it('should be able to provide its socket', () => {
        expect(member.getSocket()).toBe(socket);
    });
});

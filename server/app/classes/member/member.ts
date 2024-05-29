import { Socket } from 'socket.io';

export class Member {
    constructor(
        private socket: Socket,
        public username: string,
    ) {}

    getSocket() {
        return this.socket;
    }
}

import { Member } from '@app/classes/member/member';
import { MAX_USERNAME_LENGTH, ORGANISER_NAME, SYSTEM_NAME } from '@common/constants';
import { GameEvent, JoinResponse, LeaveReason } from '@common/events';
import { Message } from '@common/message';
import { Server, Socket } from 'socket.io';

export class Room<T extends Member> {
    messages: Message[] = [];

    private members = new Map<string, T>();
    private bannedPlayerNames: string[] = [];
    private organiser: T = null;
    private isLocked = false;
    private terminateWhenNoPlayers = false;

    constructor(
        private readonly id: string,
        private readonly server: Server,
        private readonly memberClass: new (socket: Socket, username: string) => T,
    ) {}

    getId(): string {
        return this.id;
    }

    isUnlocked(): boolean {
        return !this.isLocked;
    }

    toggleLock(): boolean {
        this.isLocked = !this.isLocked;
        return this.isUnlocked();
    }

    join(socket: Socket, username: string): JoinResponse {
        const member = new this.memberClass(socket, username);

        if (this.addOrganiser(member)) {
            return { success: true, members: this.getMemberNames() };
        }

        return this.joinAsMember(member, username);
    }

    leave(socket: Socket): void {
        if (this.isOrganiser(socket)) {
            this.organiserLeave();
        } else {
            this.memberLeave(socket);
        }
    }

    ban(socket: Socket): void {
        const name = this.getMember(socket)?.username;
        if (name) this.bannedPlayerNames.push(name);
    }

    isEmpty(): boolean {
        return this.members.size === 0 && !this.organiser;
    }

    getMembers(): T[] {
        return [...this.members.values()];
    }

    getAnyone(socket: Socket): T {
        return this.isOrganiser(socket) ? this.getOrganiser() : this.getMember(socket);
    }

    getMember(socket: Socket): T | undefined {
        return this.members.get(socket.id);
    }

    getOrganiser(): T | null {
        return this.organiser;
    }

    toOrganiser<U, V>(event: string, data?: U, callback?: (clientResponse: V) => void) {
        this.organiser?.getSocket().emit(event, ...this.filterArgs(data, callback));
    }

    toMembers<U, V>(event: string, data?: U, callback?: (clientResponse: V) => void) {
        const source = this.organiser ? this.organiser.getSocket() : this.server;
        source.to(this.id).emit(event, ...this.filterArgs(data, callback));
    }

    toAll<U, V>(event: string, data?: U, callback?: (clientResponse: V) => void) {
        this.server.to(this.id).emit(event, ...this.filterArgs(data, callback));
    }

    isOrganiser(socket: Socket): boolean {
        return this.organiser && this.organiser.getSocket().id === socket.id;
    }

    setTerminateWhenNoPlayers(): void {
        this.terminateWhenNoPlayers = true;
    }

    makeOrganiserPlayer(): void {
        if (this.organiser) {
            this.members.set(this.organiser.getSocket().id, this.organiser);
            this.organiser = null;
        }
    }

    private getMemberNames(): string[] {
        return this.getMembers().map((m) => m.username);
    }

    private isNameBanned(username: string): boolean {
        return this.findCaseInsensitive(this.bannedPlayerNames, username.trim());
    }

    private isNameTaken(username: string): boolean {
        return this.findCaseInsensitive(this.getMemberNames(), username.trim());
    }

    private has(socket: Socket): boolean {
        return this.members.has(socket.id) || this.organiser.getSocket().id === socket.id;
    }

    private addMember(member: T): void {
        if (!this.has(member.getSocket())) {
            member.getSocket().join(this.id);
            this.members.set(member.getSocket().id, member);
        }
    }

    private removeMember(member: T): void {
        if (!member) return;

        member.getSocket().leave(this.id);
        this.members.delete(member.getSocket().id);
    }

    private addOrganiser(member: T): boolean {
        const isNewOrganiser = !this.organiser;
        if (isNewOrganiser) {
            member.getSocket().join(this.id);
            member.username = ORGANISER_NAME;
            this.organiser = member;
        }
        return isNewOrganiser;
    }

    private joinAsMember(member: T, username: string): JoinResponse {
        const reason = this.joinProblem(username);
        if (!reason) {
            this.addMember(member);
            return { success: true, members: this.getMemberNames() };
        } else {
            return { success: false, error: reason };
        }
    }

    private joinProblem(username: string): string | null {
        if (this.isNameBanned(username)) {
            return `Le nom ${username} est banni`;
        }

        if (this.isNameTaken(username)) {
            return `Le nom ${username} est déjà pris`;
        }

        if (this.findCaseInsensitive([ORGANISER_NAME], username)) {
            return `Le nom ${username} est réservé`;
        }

        if (username.trim().length === 0) {
            return `Le nom ${username} est vide`;
        }

        if (username.length > MAX_USERNAME_LENGTH) {
            return 'Le nom choisi est trop long';
        }

        if (this.findCaseInsensitive([SYSTEM_NAME], username)) {
            return `Le nom ${username} est réservé`;
        }

        return this.isLocked ? `La salle ${this.id} est verrouillée` : null;
    }

    private makeEmpty(): void {
        this.members.clear();
        this.organiser = null;
    }

    private filterArgs<U, V>(data?: U, callback?: (clientResponse: V) => void): (U | ((arg: V) => void))[] {
        return [data, callback].filter((x) => x !== undefined && x !== null);
    }

    private findCaseInsensitive(arr: string[], val: string): boolean {
        return arr.some((x) => x.toLowerCase() === val.toLowerCase());
    }

    private organiserLeave(): void {
        this.getMembers().forEach((member) => {
            member.getSocket().emit(GameEvent.PlayerLeaving, { username: member.username, reason: LeaveReason.OrganiserLeft });
        });

        this.makeEmpty();
    }

    private memberLeave(socket: Socket): void {
        this.removeMember(this.getMember(socket));

        if (this.terminateWhenNoPlayers && this.members.size === 0) {
            this.toOrganiser(GameEvent.PlayerLeaving, { username: ORGANISER_NAME, reason: LeaveReason.AllPlayersLeft });
            this.makeEmpty();
        }
    }
}

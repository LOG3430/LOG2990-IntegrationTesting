import { Member } from '@app/classes/member/member';
import { BroadcastOperatorMock, broadcastMock, socketMock } from '@app/utils/socket-mock';
import { ORGANISER_NAME, SYSTEM_NAME } from '@common/constants';
import { GameEvent, LeaveReason } from '@common/events';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { Server, Socket } from 'socket.io';
import { Room } from './room';

const event = 'event';
const data = 1;

// eslint-disable-next-line
const callback = (resp: { x: number }) => {};

describe('Room', () => {
    let server: SinonStubbedInstance<Server>;
    let socket1: SinonStubbedInstance<Socket>;
    let socket2: SinonStubbedInstance<Socket>;
    let socket3: SinonStubbedInstance<Socket>;

    let member1: Member;
    let member2: Member;

    let room: Room<Member>;

    const roomId = 'ABC1';
    const username1 = 'player1';
    const username2 = 'player2';
    const username3 = 'player3';
    const username4 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

    beforeEach(() => {
        server = createStubInstance<Server>(Server);

        socket1 = socketMock('a');
        socket2 = socketMock('b');
        socket3 = socketMock('c');

        member1 = new Member(socket1, username1);
        member2 = new Member(socket2, username2);

        room = new Room(roomId, server, Member);
    });

    it('should be defined', () => {
        expect(room).toBeDefined();
    });

    it('filter args should allow non truthy values that are defined', () => {
        expect(room['filterArgs'](0)).toEqual([0]);
        expect(room['filterArgs']('')).toEqual(['']);
        expect(room['filterArgs'](undefined)).toEqual([]);
        expect(room['filterArgs'](null)).toEqual([]);
    });

    it('should provide its own id', () => {
        expect(room.getId()).toEqual(roomId);
    });

    it('sockets must have different ids for tests', () => {
        expect(socket1).not.toBe(socket2);
        expect(socket1).not.toEqual(socket2);
    });

    it('should allow querying anyone in the room (organiser or player)', () => {
        room.join(socket1, ORGANISER_NAME);
        room.join(socket2, 'player');
        expect(room.getAnyone(socket1).getSocket()).toBe(socket1);
        expect(room.getAnyone(socket2).getSocket()).toBe(socket2);
    });

    it('should allow making the organiser a player', () => {
        room.join(socket1, ORGANISER_NAME);
        room.join(socket2, 'player');
        room.makeOrganiserPlayer();
        expect(room.getOrganiser()).toBeNull();
        expect(room.getMembers()).toHaveLength(2);
    });

    describe('organiser operations', () => {
        it('should be initially unlocked, first call locks', () => {
            expect(room.toggleLock()).toBeFalsy();
            expect(room.toggleLock()).toBeTruthy();
            expect(room.toggleLock()).toBeFalsy();
        });

        it("should tell it's locked state", () => {
            expect(room.isUnlocked()).toBeTruthy();
            expect(room.toggleLock()).toBeFalsy();
            expect(room.isUnlocked()).toBeFalsy();
        });
    });

    describe('joining', () => {
        it('should have no members and null organiser initially', () => {
            expect(room.getOrganiser()).toBeNull();
            expect(room.getMembers().length).toEqual(0);
        });

        it('should set organiser as first to join, and set name as organiser', () => {
            room.join(socket1, username1);
            expect(room.getOrganiser()).toEqual(new Member(socket1, ORGANISER_NAME));
            expect(room.getMembers().length).toEqual(0);
            expect(room.isEmpty()).toBeFalsy();
        });

        it('should keep the same organiser when new members join', () => {
            room.join(socket1, username1);
            expect(room.getOrganiser()).toEqual(new Member(socket1, ORGANISER_NAME));

            room.join(socket2, username2);
            expect(room.getOrganiser()).toEqual(new Member(socket1, ORGANISER_NAME));
            expect(room.getMembers()).toContainEqual(member2);
            expect(room.getMembers().length).toEqual(1);
            expect(room.getMember(socket2)).toEqual(member2);
        });

        it('should not add duplicate members', () => {
            room.join(socket1, username1);
            expect(room.getOrganiser()).toEqual(new Member(socket1, ORGANISER_NAME));
            expect(room.getMembers().length).toEqual(0);

            room.join(socket1, username1);
            expect(room.getMembers().length).toEqual(0);

            expect(socket1.join.calledOnceWith(roomId)).toBeTruthy();
        });

        it('should be able to add multiple members', () => {
            room.join(socket3, username3);
            expect(room.getOrganiser().getSocket()).toBe(socket3);

            room.join(socket1, username1);
            room.join(socket2, username2);
            expect(room.getMembers()).toEqual(expect.arrayContaining([member1, member2]));
            expect(socket1.join.calledOnceWith(roomId)).toBeTruthy();
            expect(socket2.join.calledOnceWith(roomId)).toBeTruthy();
        });

        it('should only allow the first socket to join with organiser name', () => {
            expect(room.join(socket1, ORGANISER_NAME).success).toBeTruthy();
            expect(room.getOrganiser().getSocket()).toBe(socket1);
            expect(room.join(socket2, ORGANISER_NAME).success).toBeFalsy();
        });

        it('should do nothing if trying to ban the organiser', () => {
            room.join(socket1, username1);
            room.ban(socket1);
            expect(room.getOrganiser().getSocket()).toBe(socket1);
        });

        it('should be able to ban a member in the room, but not remove him', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);
            room.ban(socket2);

            expect(room.getMember(socket2)).toBeDefined();
            expect(room.join(socket3, username2).success).toBeFalsy();
            expect(room.getMembers().length).toEqual(1);
        });

        it('should not allow someone with an existing username', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);
            expect(room.join(socket3, username2).success).toBeFalsy();
        });

        it('should not allow someone with a blank username', () => {
            room.join(socket1, username1);
            expect(room.join(socket2, '          ').success).toBeFalsy();
        });

        it('should not allow someone with a username longer than', () => {
            room.join(socket1, username4);
            expect(room.join(socket2, username4).success).toBeFalsy();
        });

        it('should not allow someone with the username system', () => {
            room.join(socket1, SYSTEM_NAME);
            expect(room.join(socket1, SYSTEM_NAME).success).toBeFalsy();
        });

        it('should not add someone if the room isLocked', () => {
            room.join(socket1, username1);
            room.toggleLock();
            expect(!room.isUnlocked());
            expect(room.join(socket2, username2).success).toBeFalsy();
        });
    });

    describe('leaving', () => {
        it('should not throw if an unknown member leaves', () => {
            expect(() => {
                room.leave(socket1);
            }).not.toThrow();
        });

        it('should let members leave', () => {
            room.join(socket2, username2);
            expect(room.getOrganiser()).toEqual(new Member(socket2, ORGANISER_NAME));

            room.join(socket1, username1);
            expect(room.getMembers()).toContainEqual(member1);

            room.leave(socket1);
            expect(room.getMembers()).toEqual([]);
            expect(socket1.leave.calledOnceWith(roomId)).toBeTruthy();
        });

        it('should be able to leave when there are multiple members', () => {
            room.join(socket3, username3);
            expect(room.getOrganiser().getSocket()).toBe(socket3);

            room.join(socket1, username1);
            room.join(socket2, username2);
            expect(room.getMembers()).toContainEqual(member1);
            expect(room.getMembers()).toContainEqual(member2);

            room.leave(socket2);
            expect(room.getMembers()).toContainEqual(member1);
            expect(room.getMembers()).not.toContainEqual(member2);
            expect(socket2.leave.calledOnceWith(roomId)).toBeTruthy();
        });

        it('should empty itself when the organiser leaves', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);
            room.leave(socket1);
            expect(room.isEmpty()).toBeTruthy();
        });

        it('should tell each member when the organiser leaves', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);
            room.leave(socket1);

            expect(socket1.emit.notCalled).toBeTruthy();

            expect(
                socket2.emit.calledOnceWith(GameEvent.PlayerLeaving, {
                    username: username2,
                    reason: LeaveReason.OrganiserLeft,
                }),
            ).toBeTruthy();
        });

        it('should empty itself when the last player leaves and alert organiser if terminate is set', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);
            room.setTerminateWhenNoPlayers();

            room.leave(socket2);
            expect(room.isEmpty()).toBeTruthy();
            expect(
                socket1.emit.calledOnceWith(GameEvent.PlayerLeaving, {
                    username: ORGANISER_NAME,
                    reason: LeaveReason.AllPlayersLeft,
                }),
            ).toBeTruthy();
        });

        it('should not empty itself when the last player leaves if terminate', () => {
            room.join(socket1, username1);
            room.join(socket2, username2);

            room.leave(socket2);
            expect(room.isEmpty()).toBeFalsy();
            expect(socket1.emit.notCalled);
        });
    });

    describe('broadcasts', () => {
        let broadcastSpy: BroadcastOperatorMock;

        beforeEach(() => {
            broadcastSpy = broadcastMock();

            server.to.returns(broadcastSpy);
            socket1.to.returns(broadcastSpy);
        });

        it('should allow broadcasting an event to all in the room', () => {
            room.toAll(event);
            room.toAll(event, data);
            room.toAll(event, data, callback);
            expect(server.to.calledWith(room.getId())).toBeTruthy();
            expect(broadcastSpy.emit.calledWithExactly(event)).toBeTruthy();
            expect(broadcastSpy.emit.calledWithExactly(event, data)).toBeTruthy();
            expect(broadcastSpy.emit.calledWithExactly(event, data, callback)).toBeTruthy();
        });

        describe('to members', () => {
            describe('when there is no organiser', () => {
                it('should allow broadcasting an event to members in the room', () => {
                    room.toMembers(event);
                    room.toMembers(event, data);
                    room.toMembers(event, data, callback);
                    expect(server.to.calledWith(room.getId())).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event)).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event, data)).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event, data, callback)).toBeTruthy();
                });
            });

            describe('when there is an organiser', () => {
                it('should allow broadcasting an event to members in the room', () => {
                    room.join(socket1, username1);
                    room.toMembers(event);
                    room.toMembers(event, data);
                    room.toMembers(event, data, callback);
                    expect(socket1.to.calledWith(room.getId())).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event)).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event, data)).toBeTruthy();
                    expect(broadcastSpy.emit.calledWithExactly(event, data, callback)).toBeTruthy();
                });
            });
        });

        describe('to organiser', () => {
            describe('when there is no organiser', () => {
                it('should do nothing', () => {
                    expect(() => {
                        room.toOrganiser(event, data, callback);
                    }).not.toThrow();
                });
            });

            describe('when there is an organiser', () => {
                it('should allow broadcasting an event to members in the room', () => {
                    room.join(socket1, username1);
                    room.toOrganiser(event);
                    room.toOrganiser(event, data);
                    room.toOrganiser(event, data, callback);
                    expect(socket1.emit.calledWithExactly(event)).toBeTruthy();
                    expect(socket1.emit.calledWithExactly(event, data)).toBeTruthy();
                    expect(socket1.emit.calledWithExactly(event, data, callback)).toBeTruthy();
                });
            });
        });
    });
});

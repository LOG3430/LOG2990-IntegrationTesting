import { Factory, gameStateTable } from '@app/classes/game-states/factory/factory';
import { GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { quiz, playerMock } from '@app/utils/game-room-test-helpers';
import { socketMock } from '@app/utils/socket-mock';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { TestRoom } from './test-room';

describe('TestRoom', () => {
    jest.useFakeTimers();
    let room: SinonStubbedInstance<Room<Player>>;
    let testRoom: TestRoom;
    let organiser: Player;
    const factory = new Factory(gameStateTable);

    beforeEach(() => {
        room = createStubInstance<Room<Player>>(Room);
        testRoom = new TestRoom(quiz, room, factory);
        organiser = playerMock('org');
    });

    it('should be defined', () => {
        expect(testRoom).toBeDefined();
    });

    it('should include only organiser in players', () => {
        room.getMembers.returns([playerMock(''), playerMock('')]);
        room.getOrganiser.returns(organiser);
        expect(testRoom['getPlayers']()).toEqual([organiser]);
    });

    it('should return an empty list of players when there is no organiser', () => {
        room.getMembers.returns([playerMock(''), playerMock('')]);
        room.getOrganiser.returns(undefined);
        expect(testRoom['getPlayers']()).toEqual([]);
    });

    it('should return organiser when fetching it', () => {
        room.getOrganiser.returns(organiser);
        expect(testRoom['getPlayer'](organiser.getSocket())).toBe(organiser);
    });

    it('should not return a member as a player', () => {
        room.getOrganiser.returns(organiser);
        expect(testRoom['getPlayer'](socketMock('a'))).toBeUndefined();
        expect(room.getMember.notCalled).toBeTruthy();
        expect(room.getMembers.notCalled).toBeTruthy();
    });

    it('should not fail when fetching a member when there is no organiser', () => {
        room.getOrganiser.returns(undefined);
        expect(() => {
            testRoom['getPlayer'](socketMock('a'));
        }).not.toThrow();
    });

    it('should be able to start if he is the organiser', () => {
        room.isOrganiser.returns(true);
        expect(testRoom['canStart'](organiser.getSocket())).toBeTruthy();
    });

    it('should not be able to start if he is not the organiser', () => {
        room.isOrganiser.returns(false);
        expect(testRoom['canStart'](socketMock('bla'))).toBeFalsy();
    });

    it('should automatically switch to next question after showing results for some delay', () => {
        room.getOrganiser.returns(organiser);
        room.isOrganiser.returns(true);

        testRoom.startGame(organiser.getSocket());
        testRoom.verifyMCQ(organiser.getSocket(), []);

        expect(testRoom['game'].state).toBe(GameState.ShowingAnswers);
        expect(jest.getTimerCount()).toEqual(2);

        jest.runOnlyPendingTimers();

        expect(testRoom['game'].state).toBe(GameState.Answering);
    });
});

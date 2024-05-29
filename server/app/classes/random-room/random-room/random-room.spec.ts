import { Factory, gameStateTable } from '@app/classes/game-states/factory/factory';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { playerMock, spyOnPrivate } from '@app/utils/game-room-test-helpers';
import { Question } from '@common/question';
import { Quiz } from '@common/quiz';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { RandomRoom } from './random-room';

const quiz: Quiz = { questions: [{ choices: [] } as Question, { choices: [] } as Question] } as unknown as Quiz;

describe('RandomRoom', () => {
    jest.useFakeTimers();

    let room: SinonStubbedInstance<Room<Player>>;
    let randomRoom: RandomRoom;
    let organiser: Player;
    let players: Player[];
    const factory = new Factory(gameStateTable);

    beforeEach(() => {
        room = createStubInstance<Room<Player>>(Room);
        randomRoom = new RandomRoom(quiz, room, factory);
        organiser = playerMock('org');
        players = [playerMock(''), playerMock('')];
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    it('should be defined', () => {
        expect(randomRoom).toBeDefined();
    });

    it('getPlayers should return all players + organiser', () => {
        room.getMembers.returns(players);
        room.getOrganiser.returns(organiser);
        expect(randomRoom.getPlayers()).toEqual([...players, organiser]);
    });

    describe('getPlayer', () => {
        it('getPlayer should get player', () => {
            room.getMember.returns(players[0]);
            expect(randomRoom['getPlayer'](players[0].getSocket())).toEqual(players[0]);
        });

        it('getPlayer should get organiser if socket corresponds to organiser', () => {
            room.getMember.returns(undefined);
            room.getOrganiser.returns(organiser);
            expect(randomRoom['getPlayer'](organiser.getSocket())).toEqual(organiser);
        });

        it('getPlayer should return undefined if socket isnt player nor organiser', () => {
            room.getMember.returns(undefined);
            room.getOrganiser.returns(undefined);
            expect(randomRoom['getPlayer'](organiser.getSocket())).toEqual(undefined);
        });
    });

    describe('canStart', () => {
        it('should return false if receivedStart or is not organiser or is unlocked', () => {
            randomRoom['game'].receivedStart = true;
            room.isOrganiser.returns(false);
            room.isUnlocked.returns(true);
            expect(randomRoom['canStart'](organiser.getSocket())).toEqual(false);
        });

        it('should return true if has not receivedStart and is organiser and room is locked', () => {
            randomRoom['game'].receivedStart = false;
            room.isOrganiser.returns(true);
            room.isUnlocked.returns(false);
            expect(randomRoom['canStart'](organiser.getSocket())).toEqual(true);
        });
    });

    it('should automatically switch to next question after showing results for some delay', () => {
        spyOnPrivate(randomRoom, 'readyInDelay');
        randomRoom.goToNextQuestion();
        expect(randomRoom['readyInDelay']).toHaveBeenCalled();
    });

    it('should make the organiser a player when starting', () => {
        room.getMembers.returns([]);
        randomRoom['onStart']();
        expect(room.makeOrganiserPlayer.calledOnce).toBeTruthy();
    });
});

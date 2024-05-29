import { GameRoom } from '@app/classes/game-room/game-room';
import { Game, GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { Room } from '@app/classes/room/room';
import { playerMock, spyOnPrivate } from '@app/utils/game-room-test-helpers';
import { GameEvent, LeaderboardEntry, MessageEvent } from '@common/events';
import { History } from '@common/history';
import { createStubInstance, SinonStubbedInstance } from 'sinon';
import { GameOver } from './game-over';
import { Socket } from 'socket.io';

describe('GameOver', () => {
    let state: GameOver;
    let game: SinonStubbedInstance<GameRoom>;
    let room: SinonStubbedInstance<Room<Player>>;
    let playedGame: History;

    beforeEach(() => {
        room = createStubInstance(Room<Player>);
        game = createStubInstance(GameRoom);
        game.room = room;
        state = new GameOver(game);
        playedGame = {
            gameName: 'test',
            numberPlayerBeginning: 3,
            startDate: 'today',
            highestScore: 40,
        };
        game.game = {
            getTitle: () => {
                return playedGame.gameName;
            },
        } as unknown as Game;
        const numPlayers = spyOnPrivate(game, 'getLeaderboard');
        numPlayers.mockReturnValue([
            { points: 30 } as unknown as LeaderboardEntry,
            { points: 20 } as unknown as LeaderboardEntry,
            { points: 40 } as unknown as LeaderboardEntry,
        ]);
        game.startTime = playedGame.startDate;
    });

    it('should be defined', () => {
        expect(state).toBeDefined();
    });

    it('should setup when arriving in this state', () => {
        const p = playerMock('p');
        p.isMuted = true;
        game.getPlayers.returns([p]);
        state.onInit();
        expect(room.toAll.calledWith(GameEvent.Gameover)).toBeTruthy();
        expect(game.clearInterval.called).toBeTruthy();
        expect(game.emitGameOver.calledWith(playedGame)).toBeTruthy();
        expect((p.getSocket() as SinonStubbedInstance<Socket>).emit.calledOnceWith(MessageEvent.Muted, false));
        expect(p.isMuted).toBe(false);
    });

    it('should stay in this state', () => {
        expect(state.nextState()).toBe(GameState.Over);
    });
});

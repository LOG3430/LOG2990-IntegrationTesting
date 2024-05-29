import { Socket } from 'socket.io';
import { InfosPlayer, Player } from './player';
import { PlayerState } from '@common/events';

describe('Player', () => {
    jest.useFakeTimers();

    let player: Player;

    beforeEach(() => {
        player = new Player({} as unknown as Socket, 'bla');
    });

    it('should be defined', () => {
        expect(player).toBeDefined();
    });

    describe('laq answer', () => {
        it('should give empty answer if not string', () => {
            player.infos = { answers: [1] } as InfosPlayer;
            expect(player.getLaqAnswer()).toEqual({ username: 'bla', answers: '' });
        });

        it('should give answer if string', () => {
            player.infos = { answers: 'blabla' } as InfosPlayer;
            expect(player.getLaqAnswer()).toEqual({ username: 'bla', answers: 'blabla' });
        });
    });

    describe('answer mcq', () => {
        it('should set infos, selected and update state', () => {
            player.answerMcq([1]);
            expect(player.infos).toEqual({ time: Date.now(), answers: [1] });
            expect(player.selected).toEqual([1]);
            expect(player.state).toEqual(PlayerState.Submitted);
        });
    });

    describe('answer laq', () => {
        it('should set infos', () => {
            player.answerLaq('bla');
            expect(player.infos).toEqual({ time: Date.now(), answers: 'bla' });
            expect(player.state).toEqual(PlayerState.Submitted);
        });
    });

    describe('start round', () => {
        it('should reset the player state, infos and selected', () => {
            player.answerMcq([]);
            player.hasInteracted = true;
            player.startRound();
            expect(player.infos).toBeNull();
            expect(player.selected).toEqual([]);
            expect(player.state).toEqual(PlayerState.NoAction);
            expect(player.hasInteracted).toEqual(false);
        });
    });

    describe('select answer', () => {
        it('should set the state and toggle selected answers, without duplicates', () => {
            player.selectAnswer({ index: 1, isSelected: true, questionIndex: 0 });
            expect(player.state).toEqual(PlayerState.Interacted);
            expect(player.selected).toEqual([1]);

            player.selectAnswer({ index: 0, isSelected: true, questionIndex: 0 });
            player.selectAnswer({ index: 0, isSelected: true, questionIndex: 0 });
            expect(player.selected).toEqual([1, 0]);

            player.selectAnswer({ index: 1, isSelected: false, questionIndex: 0 });
            expect(player.selected).toEqual([0]);
        });
    });

    describe('interact laq', () => {
        it("should update the player's state", () => {
            player.interactLaq({ isChanged: true, answerText: 'bla' });
            expect(player.hasInteracted).toBe(true);
            expect(player.unconfirmedText).toEqual('bla');
            expect(player.state).toBe(PlayerState.Interacted);

            player.interactLaq({ isChanged: false, answerText: 'blabla' });
            expect(player.hasInteracted).toBe(false);
            expect(player.unconfirmedText).toEqual('blabla');
            expect(player.state).toBe(PlayerState.Interacted);
        });
    });

    describe('get score', () => {
        it('should give the players attributes as leaderboard entry', () => {
            player.numberOfBonuses = 1;
            player.score = 2;
            player.state = PlayerState.Submitted;
            player.isMuted = true;
            expect(player.getScore()).toEqual({
                username: 'bla',
                nBonus: 1,
                points: 2,
                state: PlayerState.Submitted,
                isMuted: true,
            });
        });
    });
});

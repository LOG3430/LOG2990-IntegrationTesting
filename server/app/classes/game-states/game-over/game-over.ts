import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';
import { GameEvent, Leaderboard, MessageEvent } from '@common/events';
import { History } from '@common/history';

export class GameOver extends GameStateBase {
    onInit(): void {
        this.gameroom.room.toAll(GameEvent.Gameover, this.gameroom.getGameResults());
        this.gameroom.room.toAll(Leaderboard.send, this.gameroom.getLeaderboard());
        this.gameroom.emitGameOver(this.getPlayedGame());
        this.gameroom.clearInterval();
        this.gameroom.room.makeOrganiserPlayer();
        this.gameroom.getPlayers().forEach((p) => p.getSocket().emit(MessageEvent.Muted, (p.isMuted = false)));
    }

    nextState(): GameState {
        return GameState.Over;
    }

    private getPlayedGame(): History {
        return {
            gameName: this.gameroom.game.getTitle(),
            numberPlayerBeginning: this.gameroom.getLeaderboard().length,
            startDate: this.gameroom.startTime,
            highestScore: this.getHighestScore(),
        };
    }

    private getHighestScore(): number {
        return this.gameroom.getLeaderboard().reduce((acc, user) => (user.points > acc ? user.points : acc), 0);
    }
}

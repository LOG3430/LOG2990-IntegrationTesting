import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';
import { BarChartEvent, GameEvent, Leaderboard } from '@common/events';
import { QTypes } from '@common/question-type';

export class Answering extends GameStateBase {
    onInit(): void {
        this.gameroom.room.toAll(GameEvent.NewQuestion, this.gameroom.getGameQuestion());
        this.gameroom.room.toAll(GameEvent.IsAnswering);
        this.gameroom.room.setTerminateWhenNoPlayers();
        this.gameroom.startRound();
        this.gameroom.room.toOrganiser(Leaderboard.send, this.gameroom.getLeaderboard());
        this.gameroom.room.toOrganiser(BarChartEvent.SendSelectedList, this.gameroom.getSelectedVotes().getVotes());
        this.gameroom.tick();
        this.gameroom.setTimerTimedout(null);
    }

    nextState(): GameState {
        if (this.gameroom.allPlayersAnswered()) {
            return this.getQuestionType() === QTypes.MCQ ? GameState.ShowingAnswers : GameState.Evaluation;
        }

        return !this.gameroom.isTimerDone() ? GameState.Answering : GameState.TimedOut;
    }

    private getQuestionType() {
        return this.gameroom.getCurrentQuestion().type;
    }
}

import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { Verificator } from '@app/classes/verificator/verificator';
import { BarChartEvent, GameEvent, Leaderboard } from '@common/events';

export class ShowingAnswers extends GameStateBase {
    onInit(): void {
        this.gameroom.getPlayers().forEach((p: Player) => {
            p.score += this.getResult(p).points;
            p.numberOfBonuses += +this.getResult(p).hasBonus;
            p.getSocket().emit(GameEvent.QuestionResults, this.getResult(p));
        });

        this.gameroom.room.toAll(GameEvent.IsShowingAnswers);
        this.gameroom.pushSubmittedVotes(this.gameroom.getSelectedVotes());
        this.gameroom.room.toOrganiser(BarChartEvent.SendGrades, this.gameroom.getGradeCounts());
        this.gameroom.room.toOrganiser(Leaderboard.send, this.gameroom.getLeaderboard());

        this.gameroom.clearInterval();
        this.gameroom.tick();

        this.gameroom.goToNextQuestion();
        if (!this.gameroom.hasNextQuestion()) {
            this.gameroom.setFinalLeaderboard();
        }
    }

    nextState(): GameState {
        if (!this.gameroom.readyForNextQuestion()) {
            return GameState.ShowingAnswers;
        }
        return this.gameroom.hasNextQuestion() ? GameState.Answering : GameState.Over;
    }

    private getResult(p: Player) {
        if (typeof p.infos.answers !== 'string') {
            return Verificator.verifyMCQ(this.gameroom.getCurrentQuestion(), p.infos.answers, this.gameroom.isFirstToAnswer(p));
        } else {
            return Verificator.verifyLAQ(this.gameroom.getCurrentQuestion(), this.gameroom.getGrade(p));
        }
    }
}

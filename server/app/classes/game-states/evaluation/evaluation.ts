import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';
import { GameEvent, UserAnswer } from '@common/events';

export class Evaluation extends GameStateBase {
    onInit(): void {
        this.gameroom.room.toOrganiser(GameEvent.Evaluating, this.getLaqAnswers());
        this.gameroom.room.toMembers(GameEvent.QuestionEvaluation);
        this.gameroom.clearInterval();
    }

    nextState(): GameState {
        return this.isGraded() ? GameState.ShowingAnswers : GameState.Evaluation;
    }

    private getLaqAnswers(): UserAnswer[] {
        return this.gameroom.getPlayers().map((p) => p.getLaqAnswer());
    }

    private isGraded(): boolean {
        return this.gameroom.isGraded();
    }
}

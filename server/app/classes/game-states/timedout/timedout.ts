import { GameStateBase } from '@app/classes/game-states/game-state-base/game-state-base';
import { GameState } from '@app/classes/game/game';
import { Player } from '@app/classes/player/player';
import { QTypes } from '@common/question-type';

export class Timedout extends GameStateBase {
    onInit(): void {
        this.gameroom.setTimerTimedout(new Date().getTime());
        this.gameroom.tick();
        this.gameroom.getPlayers().forEach((p) => {
            p.infos = p.infos ?? { time: Date.now(), answers: this.getPlayerAnswer(p) };
        });

        this.gameroom.update();
    }

    nextState(): GameState {
        return this.getQuestionType() === QTypes.MCQ ? GameState.ShowingAnswers : GameState.Evaluation;
    }

    private getQuestionType() {
        return this.gameroom.getCurrentQuestion().type;
    }

    private getPlayerAnswer(p: Player) {
        return this.getQuestionType() === QTypes.MCQ ? p.selected : p.unconfirmedText;
    }
}

import { Member } from '@app/classes/member/member';
import { Interaction, LeaderboardEntry, PlayerState, SelectedChoice, UserAnswer } from '@common/events';

export interface InfosPlayer {
    time: number;
    answers: number[] | string;
}

export class Player extends Member {
    score: number = 0;
    numberOfBonuses = 0;
    state: PlayerState = PlayerState.NoAction;
    infos: InfosPlayer | null = null;

    isMuted: boolean = false;
    hasInteracted: boolean = false;

    selected: number[] = [];
    unconfirmedText: string = '';

    getLaqAnswer(): UserAnswer {
        return {
            username: this.username,
            answers: typeof this.infos.answers === 'string' ? this.infos.answers : '',
        };
    }

    answerMcq(answers: number[]): void {
        this.infos = { time: Date.now(), answers };
        this.selected = answers;
        this.state = PlayerState.Submitted;
    }

    answerLaq(answers: string): void {
        this.infos = { time: Date.now(), answers };
        this.state = PlayerState.Submitted;
    }

    startRound(): void {
        this.state = PlayerState.NoAction;
        this.infos = null;
        this.selected = [];
        this.unconfirmedText = '';
        this.hasInteracted = false;
    }

    selectAnswer(selectedChoice: SelectedChoice): void {
        this.state = PlayerState.Interacted;
        this.selected = this.selected.filter((ans) => ans !== selectedChoice.index);
        if (selectedChoice.isSelected) {
            this.selected.push(selectedChoice.index);
        }
    }

    interactLaq(interaction: Interaction): void {
        this.hasInteracted = interaction.isChanged;
        this.unconfirmedText = interaction.answerText;
        if (interaction.isChanged && this.state === PlayerState.NoAction) {
            this.state = PlayerState.Interacted;
        }
    }

    getScore(): LeaderboardEntry {
        return { username: this.username, nBonus: this.numberOfBonuses, points: this.score, state: this.state, isMuted: this.isMuted };
    }
}

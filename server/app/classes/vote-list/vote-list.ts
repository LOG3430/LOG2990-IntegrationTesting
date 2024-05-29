import { ChoiceVote, SelectedChoice } from '@common/events';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';

export class VoteList {
    private votes: ChoiceVote[];

    constructor(question: Question) {
        if (question.type === QTypes.MCQ) {
            this.votes = question.choices.map((choice) => ({ name: choice.text, votes: 0, isCorrect: choice.isCorrect }));
        }
    }

    getVotes(): ChoiceVote[] {
        return this.votes;
    }

    toggle(selectedChoice: SelectedChoice) {
        if (selectedChoice.isSelected) {
            this.votes[selectedChoice.index].votes += 1;
        } else {
            this.votes[selectedChoice.index].votes -= 1;
        }
    }
}

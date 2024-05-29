import { SelectedChoice } from '@common/events';
import { Question } from '@common/question';
import { QTypes } from '@common/question-type';
import { VoteList } from './vote-list';

describe('VoteList', () => {
    let voteList: VoteList;

    beforeEach(() => {
        voteList = new VoteList({
            type: QTypes.MCQ,
            choices: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
            ],
        } as Question);
    });

    it('should be defined', () => {
        expect(voteList).toBeDefined();
    });

    it('should provide initialised choice votes', () => {
        expect(voteList.getVotes()).toEqual([
            { name: 'a', votes: 0, isCorrect: true },
            { name: 'b', votes: 0, isCorrect: false },
        ]);
    });

    it('should toggle add votes', () => {
        voteList.toggle({ index: 0, isSelected: true } as SelectedChoice);
        expect(voteList.getVotes()[0].votes).toEqual(1);
    });

    it('should toggle remove votes', () => {
        voteList.toggle({ index: 1, isSelected: true } as SelectedChoice);
        expect(voteList.getVotes()[1].votes).toEqual(1);
        voteList.toggle({ index: 1, isSelected: false } as SelectedChoice);
        expect(voteList.getVotes()[1].votes).toEqual(0);
    });
});

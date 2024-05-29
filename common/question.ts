import { Choice } from './choice';
import { QTypes } from './question-type';

export interface Question {
    id: string;
    lastModif: string;
    type: QTypes;
    text: string;
    points: number;
    choices?: Choice[] | undefined;
}

import { QTypes } from './question-type';

export enum GameEvent {
    Create = 'create',

    ShowPresentation = 'show presentation',

    Join = 'join',
    Leave = 'leave',

    NewQuestion = 'new question',
    Tick = 'tick',

    SubmitMCQ = 'submit mcq',
    SubmitLAQ = 'submit LAQ',
    Timeout = 'timeout',

    Evaluating = 'evaluating',
    QuestionEvaluation = 'question evaluation',

    IsAnswering = 'is answering',
    IsShowingAnswers = 'is showing answers',

    QuestionResults = 'request question results',
    Gameover = 'gameover',

    NewPlayer = 'new player',
    PlayerLeaving = 'player leaving',

    Panicking = 'panicking',
}

export enum OrganiserEvent {
    ToggleLock = 'togglelock',
    KickOut = 'kickout',
    MutePlayer = 'muteplayer',
    NewQuestion = 'newquestion',
    GameOver = 'gameover',
    EndGame = 'endgame',
    Start = 'start',
    RequestNewQuestion = 'request new question',
    GoToGameResults = 'go to game results',
    sendResults = 'send results',
    Pause = 'pause',
    GoPanic = 'gopanic',
}

export enum MessageEvent {
    Sent = 'sent',
    Message = 'message',
    Load = 'load',
    Muted = 'muted',
}

export enum BarChartEvent {
    SendSelected = 'sendselected',
    SendSelectedList = 'sendselectedlist',
    SendSubmitList = 'sendsubmitlist',
    SendInteracted = 'sendinteracted',
    SendGrades = 'sendgrades',
    SendFinalGrades = 'sendfinalgrades',
}

export enum Leaderboard {
    send = 'send leaderboard',
}

export enum PlayerState {
    NoAction,
    Interacted,
    Submitted,
    Left,
}

export enum GameType {
    Normal,
    Test,
    Aleatoire,
}

export enum GradeCategory {
    Zero = 0,
    Fifty = 50,
    Hundred = 100,
}

export interface LeaderboardEntry {
    username: string;
    points: number;
    nBonus: number;
    state: PlayerState;
    isMuted: boolean;
}

export interface CreateRequest {
    type: GameType;
    quizId?: string;
    length?: number;
}

export interface CreateResponse {
    success: boolean;
    roomId?: string;
    joinResponse?: JoinResponse;

    error?: string;
}

export interface JoinResponse {
    success: boolean;
    type?: GameType;
    title?: string;
    members?: string[];
    totalNumberOfQuestions?: number;

    error?: string;
}

export interface PlayerInfos {
    roomId: string;
    username: string;
}

export interface GameQuestion {
    points: number;
    index: number;
    text: string;
    choices?: string[];
    type: QTypes;
}

export interface QuestionResults {
    points: number;
    hasBonus?: boolean;
    goodAnswers?: string[] | null;
}

export interface ChoiceVote {
    name: string;
    votes: number;
    isCorrect: boolean;
}

export interface SubmitInfos {
    howManySubmitted: number;
}

export interface GameResults {
    question: GameQuestion[];
    votes?: ChoiceVote[][];
    gradeCounts?: GradeCount[];
}

export interface SelectedChoice {
    isSelected: boolean;
    index: number;
    questionIndex: number;
}

export enum LeaveReason {
    Voluntary = 'Voluntary',
    Banned = 'Banned',
    OrganiserLeft = 'OrganiserLeft',
    AllPlayersLeft = 'AllPlayersLeft',
}

export interface LeaveDescription {
    username: string;
    reason: LeaveReason;
}

export interface UserAnswer {
    username: string;
    answers: string;
}

export interface Grade {
    username: string;
    grade: number;
}

export interface InteractionStatus {
    interacted: number;
    notInteracted: number;
}

export interface Interaction {
    isChanged: boolean;
    answerText: string;
}

export type GradeCount = Record<GradeCategory, number>;

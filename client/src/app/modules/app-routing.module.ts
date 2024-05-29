import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ResultComponent } from '@app/components/result/result.component';
import { AdminPageComponent } from '@app/pages/admin-page/admin-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { HistoryPageComponent } from '@app/pages/history-page/history-page.component';
import { JoinGamePageComponent } from '@app/pages/join-game-page/join-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { NotFoundPageComponent } from '@app/pages/not-found-page/not-found-page.component';
import { QuestionCatalogComponent } from '@app/pages/question-catalog/question-catalog.component';
import { QuizCatalogComponent } from '@app/pages/quiz-catalog/quiz-catalog.component';
import { QuizCreatorPageComponent } from '@app/pages/quiz-creator-page/quiz-creator-page.component';
import { TestPageComponent } from '@app/pages/test-page/test-page.component';
import { AdminService } from '@app/services/admin/admin.service';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'join-page', component: JoinGamePageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'test', component: TestPageComponent },

    {
        path: 'admin',
        canActivate: [AdminService.isAdminFunc()],
        children: [
            { path: '', component: AdminPageComponent },
            { path: 'quiz/catalog', component: QuizCatalogComponent },
            { path: 'quiz/create', component: QuizCreatorPageComponent },
            { path: 'quiz/modify', component: QuizCreatorPageComponent },
            { path: 'questions/catalog', component: QuestionCatalogComponent },
            { path: 'catalog', component: QuizCatalogComponent },
            { path: 'game/create', component: QuizCreatorPageComponent },
            { path: 'quiz/history', component: HistoryPageComponent },
        ],
    },
    { path: 'party/create', component: CreateGamePageComponent },
    { path: 'result', component: ResultComponent },

    { path: '**', pathMatch: 'full', component: NotFoundPageComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}

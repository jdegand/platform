import { Routes } from '@angular/router';
import { authGuard } from '@example-app/auth/services';
import { NotFoundPageComponent } from '@example-app/core/containers/not-found-page.component';

export const routes: Routes = [
  { path: '', redirectTo: '/books', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./auth/auth.routes'),
  },
  {
    path: 'books',
    loadChildren: () => import('./books/books.routes').then((m) => m.routes),
    canActivate: [authGuard],
  },
  {
    path: '**',
    component: NotFoundPageComponent,
    data: { title: 'Not found' },
  },
];

import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';

import { AppComponent } from './app/core/containers/app.component';
import { routes } from './app/app.routes';
import { rootReducers, metaReducers } from './app/reducers';
import { UserEffects, RouterEffects } from './app/core/effects';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(routes),
    provideStore(rootReducers, {
      metaReducers,
      runtimeChecks: {
        strictStateSerializability: true,
        strictActionSerializability: true,
        strictActionWithinNgZone: true,
        strictActionTypeUniqueness: true,
      },
    }),
    provideEffects([UserEffects, RouterEffects]),
    provideStoreDevtools({
      name: 'NgRx Book Store App',
      // logOnly: !isDevMode(), // Uncomment for production
    }),
    provideRouterStore(),
  ],
});

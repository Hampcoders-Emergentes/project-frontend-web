import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { watchSessionEnd } from '@iam/presentation/session-shell';

/** Root component: renders the routed shell and reacts when the session ends while the app is open. */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  template: '<router-outlet />',
})
export class App {
  constructor() {
    watchSessionEnd();
  }
}

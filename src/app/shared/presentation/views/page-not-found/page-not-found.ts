import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Shown for any URL that matches no route. It reveals nothing about stores or resources and offers the
 * way back to the start.
 */
@Component({
  imports: [RouterLink, TranslatePipe],
  selector: 'app-page-not-found',
  styleUrl: './page-not-found.css',
  templateUrl: './page-not-found.html',
})
export class PageNotFound {}

import { inject, Injectable } from '@angular/core';
import { AsyncResource, MutationState } from '@shared/application/async-resource';
import type { NotificationPreferences, NotificationRoute } from '@notifications/domain/model/notification-route';
import {
  GetNotificationPreferencesUseCase,
  UpdateNotificationPreferencesUseCase,
} from '@notifications/application/use-cases/notification-preferences-use-cases';

/** Notification-channel preferences state (US36). */
@Injectable({ providedIn: 'root' })
export class NotificationPreferencesStore {
  private readonly getUseCase = inject(GetNotificationPreferencesUseCase);
  private readonly updateUseCase = inject(UpdateNotificationPreferencesUseCase);

  readonly preferences = new AsyncResource<NotificationPreferences>();
  readonly saveState = new MutationState();

  load(storeId: string): void {
    this.saveState.clear();
    this.preferences.load(storeId, this.getUseCase.execute(storeId));
  }

  save(storeId: string, routes: readonly NotificationRoute[]): void {
    this.saveState.run(this.updateUseCase.execute(storeId, routes), (saved) => this.preferences.accept(storeId, saved));
  }
}

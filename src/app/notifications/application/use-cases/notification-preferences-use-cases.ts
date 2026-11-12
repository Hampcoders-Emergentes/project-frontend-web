import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { NotificationPreferences, NotificationRoute } from '@notifications/domain/model/notification-route';
import { NotificationPreferencesPort } from '@notifications/application/ports/notification-preferences.port';

@Injectable({ providedIn: 'root' })
export class GetNotificationPreferencesUseCase {
  private readonly port = inject(NotificationPreferencesPort);
  execute(storeId: string): Observable<NotificationPreferences> {
    return this.port.get(storeId);
  }
}

@Injectable({ providedIn: 'root' })
export class UpdateNotificationPreferencesUseCase {
  private readonly port = inject(NotificationPreferencesPort);
  execute(storeId: string, routes: readonly NotificationRoute[]): Observable<NotificationPreferences> {
    return this.port.update(
      storeId,
      routes.map((route) => ({
        ...route,
        destination: route.destination?.trim() || null,
        recipientName: route.recipientName?.trim() || null,
      })),
    );
  }
}

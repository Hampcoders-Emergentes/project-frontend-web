import type { Observable } from 'rxjs';
import type { NotificationPreferences, NotificationRoute } from '@notifications/domain/model/notification-route';

/** Store notification preferences; `PUT` replaces the whole route list (last write wins). */
export abstract class NotificationPreferencesPort {
  abstract get(storeId: string): Observable<NotificationPreferences>;
  abstract update(storeId: string, routes: readonly NotificationRoute[]): Observable<NotificationPreferences>;
}

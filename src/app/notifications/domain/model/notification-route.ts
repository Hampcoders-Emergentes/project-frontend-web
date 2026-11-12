/** Delivery channel of a notification route. */
export type NotificationChannel = 'EMAIL' | 'SMS' | 'DASHBOARD_PUSH' | 'WEBHOOK';
/** Who receives the route. */
export type RecipientRole = 'STORE_MANAGER' | 'OPERATIONAL_STAFF';
/** Alert urgency a route covers. */
export type UrgencyLevel = 'CRITICAL' | 'NON_CRITICAL';

export const NOTIFICATION_CHANNELS: readonly NotificationChannel[] = ['EMAIL', 'SMS', 'DASHBOARD_PUSH', 'WEBHOOK'];
export const RECIPIENT_ROLES: readonly RecipientRole[] = ['STORE_MANAGER', 'OPERATIONAL_STAFF'];
export const URGENCY_LEVELS: readonly UrgencyLevel[] = ['CRITICAL', 'NON_CRITICAL'];

/** Documented limits of the notification preferences. */
export const NOTIFICATION_LIMITS = { maxRoutes: 20, webhookMaxLength: 254 } as const;

/** One notification route. */
export interface NotificationRoute {
  readonly channel: NotificationChannel;
  readonly destination: string | null;
  readonly recipientRole: RecipientRole;
  readonly recipientName: string | null;
  readonly urgencyLevels: readonly UrgencyLevel[];
  readonly enabled: boolean;
}

/** Store notification preferences (US36). `isDefault` until the manager saves them once. */
export interface NotificationPreferences {
  readonly isDefault: boolean;
  readonly updatedAt: Date | null;
  readonly routes: readonly NotificationRoute[];
}

/**
 * Whether real delivery depends on deployment configuration: email needs SMTP and SMS a gateway,
 * otherwise the API only logs them. The UI must never promise delivery for these channels.
 */
export function deliveryDependsOnConfiguration(channel: NotificationChannel): boolean {
  return channel === 'EMAIL' || channel === 'SMS';
}

/** Whether the channel needs a destination. */
export function requiresDestination(channel: NotificationChannel): boolean {
  return channel !== 'DASHBOARD_PUSH';
}

const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?|0\.0\.0\.0)/i;

/**
 * Client-side check of a webhook destination: public `https`, no credentials, no loopback/private or
 * `.local`/`.internal` host, at most 254 characters (the server validates again).
 */
export function isPublicHttpsUrl(value: string): boolean {
  if (value.length > NOTIFICATION_LIMITS.webhookMaxLength) {
    return false;
  }
  const match = /^https:\/\/([^/?#]+)/i.exec(value.trim());
  const authority = match?.[1];
  if (!authority || authority.includes('@')) {
    return false;
  }
  const host = authority.replace(/:\d+$/, '').toLowerCase();
  return !PRIVATE_HOST.test(host) && !host.endsWith('.local') && !host.endsWith('.internal') && host.includes('.');
}

/** Problems of one route. */
export type RouteProblem = 'destinationRequired' | 'emailInvalid' | 'webhookInvalid' | 'urgencyRequired';

/**
 * Validates a route against the documented rules.
 * @param route - The route.
 */
export function routeProblem(route: NotificationRoute): RouteProblem | null {
  if (route.urgencyLevels.length === 0) {
    return 'urgencyRequired';
  }
  const destination = route.destination?.trim() ?? '';
  if (requiresDestination(route.channel) && destination === '') {
    return 'destinationRequired';
  }
  if (route.channel === 'EMAIL' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination)) {
    return 'emailInvalid';
  }
  if (route.channel === 'WEBHOOK' && !isPublicHttpsUrl(destination)) {
    return 'webhookInvalid';
  }
  return null;
}

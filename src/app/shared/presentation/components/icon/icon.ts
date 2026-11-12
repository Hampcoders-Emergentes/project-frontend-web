import { Component, computed, inject, input } from '@angular/core';
import { IconSprite } from '@shared/presentation/components/icon/icon-sprite';

/**
 * Symbols available in the icon sprite `public/assets/icons/icons.svg` (Tabler outline icons).
 * Add the symbol to the sprite before adding its name here.
 */
export type IconName =
  | 'alert-circle'
  | 'alert-octagon'
  | 'alert-triangle'
  | 'arrow-right'
  | 'bell-ringing'
  | 'bolt'
  | 'broadcast'
  | 'building-skyscraper'
  | 'building-store'
  | 'buildings'
  | 'calendar-event'
  | 'chart-bar'
  | 'check'
  | 'chef-hat'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'circle-check'
  | 'clipboard-list'
  | 'clock'
  | 'cpu'
  | 'database'
  | 'device-mobile'
  | 'download'
  | 'droplet'
  | 'external-link'
  | 'file'
  | 'file-check'
  | 'headset'
  | 'info-circle'
  | 'loader-2'
  | 'lock'
  | 'login-2'
  | 'logout'
  | 'mail'
  | 'menu-2'
  | 'message'
  | 'moon'
  | 'phone'
  | 'player-pause'
  | 'premium-rights'
  | 'refresh'
  | 'robot'
  | 'scale'
  | 'send'
  | 'shield-check'
  | 'tool'
  | 'user'
  | 'wave-saw-tool'
  | 'wifi'
  | 'wifi-off'
  | 'world'
  | 'x';

/**
 * Renders an icon of the sprite in the current text color, sized 1em unless the host is sized by the
 * parent. Icons are decorative (hidden from assistive technologies) unless a translated `label` is given.
 */
@Component({
  selector: 'app-icon',
  styleUrl: './icon.css',
  templateUrl: './icon.html',
})
export class Icon {
  readonly name = input.required<IconName>();
  /** The translated accessible name of a meaningful icon. Omit it for decorative icons. */
  readonly label = input<string | null>(null);

  private readonly sprite = inject(IconSprite);
  protected readonly href = computed(() => this.sprite.href(this.name()));
}

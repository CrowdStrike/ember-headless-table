import Route from '@ember/routing/route';
import { service } from '@ember/service';

import { type ThemeManager, THEMES } from '@crowdstrike/ember-toucan-styles';

export default class Application extends Route {
  @service declare themeManager: ThemeManager;

  beforeModel() {
    this.themeManager.setup(THEMES.LIGHT);
  }
}

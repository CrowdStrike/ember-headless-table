import { tracked } from '@glimmer/tracking';
import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class Docs extends Controller {
  @tracked currentHeadingId: string | undefined;

  @action
  setCurrentHeadingId(id: string | undefined): void {
    this.currentHeadingId = id;
  }
}

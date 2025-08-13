import { Component } from '@angular/core';
import { MigrationStepperComponent } from './components/migration-stepper/migration-stepper.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MigrationStepperComponent],
  template: '<app-migration-stepper></app-migration-stepper>'
})
export class AppComponent {
  protected readonly title = 'Bluesky Social Migrator';
}

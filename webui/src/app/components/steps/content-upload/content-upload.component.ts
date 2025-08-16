import { Component, OnInit, Output, EventEmitter, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, tap } from 'rxjs';

import { InstagramService } from '../../../services/interfaces/instagram-service.interface';
import { MigrationStateService } from '../../../services/migration-state.service';
import { ValidationResult, MigrationState } from '../../../models/migration-state.interface';
import { INSTAGRAM_SERVICE } from '../../../app.config';
import { Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Step 1: Content Upload Component
 * 
 * Handles Instagram export data upload, validation, and initial processing.
 * Users can drag & drop or select files, view validation results, and proceed
 * to the next step once data is validated.
 */
@Component({
  selector: 'app-content-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './content-upload.component.html',
  styleUrls: ['./content-upload.component.scss']
})
export class ContentUploadComponent implements OnInit {
  /** Currently selected files for upload */
  selectedFiles: File[] = [];

  /** Whether files are currently being processed */
  isProcessing = false;

  /** Upload progress percentage */
  uploadProgress = 0;

  /** Validation results from Instagram service */
  validationResult: ValidationResult | null = null;

  /** Whether the step is completed and can proceed */
  isStepCompleted = false;

  /** Error messages to display */
  errors: string[] = [];

  /** Warning messages to display */
  warnings: string[] = [];

  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();

  constructor(
    @Inject(INSTAGRAM_SERVICE) private instagramService: InstagramService,
    private migrationStateService: MigrationStateService,
    private destroyRef: DestroyRef
  ) { }

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.pipe(takeUntilDestroyed(this.destroyRef), tap((state: MigrationState) => {
      const currentStep = state.steps[0]; // Content upload is step 0
      this.isStepCompleted = currentStep.completed;
      this.errors = currentStep.errors;
      this.warnings = currentStep.warnings;
    })).subscribe();
  }

  /**
   * Handles file selection from file input
   * @param event File selection event
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.validateFiles();
    }
  }

  /**
   * Handles drag and drop file upload
   * @param event Drag and drop event
   */
  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.selectedFiles = Array.from(event.dataTransfer.files);
      this.validateFiles();
    }
  }

  /**
   * Prevents default drag behavior
   * @param event Drag event
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  /**
   * Removes a file from the selection
   * @param index Index of file to remove
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.resetValidation();
  }

  /**
   * Clears all selected files
   */
  clearFiles(): void {
    this.selectedFiles = [];
    this.resetValidation();
  }

  /**
   * Validates the selected files using Instagram service
   */
  async validateFiles(): Promise<void> {
    if (this.selectedFiles.length === 0) return;

    this.isProcessing = true;
    this.uploadProgress = 0;
    this.errors = [];
    this.warnings = [];

    try {
      // Simulate upload progress
      await this.simulateUploadProgress();

      // Validate files with Instagram service
      this.validationResult = await this.instagramService.validateExportData(this.selectedFiles);

      if (this.validationResult.isValid) {
        this.completeStep();
      } else {
        this.errors = this.validationResult.errors;
        this.warnings = this.validationResult.warnings;
      }
    } catch (error) {
      this.errors = [`Validation failed: ${error}`];
    } finally {
      this.isProcessing = false;
      this.uploadProgress = 100;
    }
  }

  /**
   * Completes the current step and updates migration state
   */
  private completeStep(): void {
    this.isStepCompleted = true;
    this.migrationStateService.completeStep(0);

    // Update step data with validation results
    if (this.validationResult) {
      this.migrationStateService.updateStepData(0, {
        posts: this.validationResult.posts,
        media: this.validationResult.media,
        validationResult: this.validationResult
      });
    }

    // Emit step completed event
    this.stepCompleted.emit();
  }

  /**
   * Resets validation state
   */
  private resetValidation(): void {
    this.validationResult = null;
    this.isStepCompleted = false;
    this.errors = [];
    this.warnings = [];
    this.uploadProgress = 0;
  }

  /**
   * Simulates upload progress for MVP demonstration
   */
  private async simulateUploadProgress(): Promise<void> {
    for (let i = 0; i <= 100; i += 10) {
      this.uploadProgress = i;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Gets the total size of selected files in MB
   */
  getTotalFileSize(): string {
    const totalBytes = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);
    return `${totalMB} MB`;
  }

  /**
   * Gets the count of different file types
   */
  getFileTypeCounts(): { [key: string]: number } {
    const counts: { [key: string]: number } = {};
    this.selectedFiles.forEach(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'unknown';
      counts[extension] = (counts[extension] || 0) + 1;
    });
    return counts;
  }
}

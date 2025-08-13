import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { Subscription } from 'rxjs';

import { InstagramService } from '../../../services/interfaces/instagram-service.interface';
import { MigrationStateService } from '../../../services/migration-state.service';
import { MigrationConfig, InstagramPost, ProcessedPost } from '../../../models/migration-state.interface';
import { INSTAGRAM_SERVICE } from '../../../app.config';
import { Inject } from '@angular/core';
import { MigrationState } from '../../../models/migration-state.interface';

/**
 * Step 3: Migration Configuration Component
 * 
 * Allows users to configure migration settings, preview posts,
 * set date ranges, and customize media quality before execution.
 * Users can review and adjust settings before starting migration.
 */
@Component({
  selector: 'app-migration-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule
  ],
  templateUrl: './migration-config.component.html',
  styleUrls: ['./migration-config.component.scss']
})
export class MigrationConfigComponent implements OnInit, OnDestroy {
  /** Configuration form group */
  configForm: FormGroup;
  
  /** Whether configuration is being processed */
  isProcessing = false;
  
  /** Whether the step is completed and can proceed */
  isStepCompleted = false;
  
  /** Instagram posts from previous step */
  instagramPosts: InstagramPost[] = [];
  
  /** Processed posts preview */
  processedPosts: ProcessedPost[] = [];
  
  /** Current migration configuration */
  migrationConfig: MigrationConfig | null = null;
  
  /** Estimated migration time */
  estimatedTime = '';
  
  /** Whether to show advanced options */
  showAdvancedOptions = false;
  
  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();

  constructor(
    @Inject(INSTAGRAM_SERVICE) private instagramService: InstagramService,
    private migrationStateService: MigrationStateService,
    private fb: FormBuilder
  ) {
    this.configForm = this.fb.group({
      includeLikes: [true],
      includeComments: [true],
      startDate: [null],
      endDate: [null],
      mediaQuality: ['medium', Validators.required],
      batchSize: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      preserveOriginalDates: [true],
      addWatermark: [false],
      customHashtags: [''],
      excludePrivatePosts: [true]
    });
  }

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.subscribe((state: MigrationState) => {
      const currentStep = state.steps[2]; // Migration config is step 2
      this.isStepCompleted = currentStep.completed;
      
      // Load Instagram data from previous step
      if (state.steps[0]?.data) {
        this.instagramPosts = state.steps[0].data.posts || [];
      }
      
      // Load existing configuration
      if (state.migrationConfig) {
        this.migrationConfig = state.migrationConfig;
        this.configForm.patchValue(this.migrationConfig);
      }
      
      // Process posts if we have Instagram data
      if (this.instagramPosts.length > 0) {
        this.processPosts();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /**
   * Processes Instagram posts to create preview
   */
  async processPosts(): Promise<void> {
    if (this.instagramPosts.length === 0) return;

    this.isProcessing = true;
    
    try {
      // Create mock files for processing (in real implementation, this would use actual files)
      const mockFiles = [new File([''], 'mock.json', { type: 'application/json' })];
      
      // Process posts with Instagram service
      this.processedPosts = await this.instagramService.processInstagramData(mockFiles);
      
      // Estimate migration time
      this.estimatedTime = await this.instagramService.estimateMigrationTime(this.processedPosts);
      
    } catch (error) {
      console.error('Failed to process posts:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Handles form submission and saves configuration
   */
  async onSubmit(): Promise<void> {
    if (this.configForm.invalid) return;

    this.isProcessing = true;
    
    try {
      const config: MigrationConfig = {
        ...this.configForm.value,
        dateRange: {
          start: this.configForm.value.startDate,
          end: this.configForm.value.endDate
        }
      };
      
      // Save configuration to migration state
      this.migrationStateService.updateStepData(2, { config });
      
      // Complete the step
      this.isStepCompleted = true;
      this.migrationStateService.completeStep(2);
      
      // Emit step completed event
      this.stepCompleted.emit();
      
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Filters posts based on current configuration
   */
  getFilteredPosts(): InstagramPost[] {
    if (!this.instagramPosts.length) return [];
    
    let filtered = [...this.instagramPosts];
    
    // Apply date range filter
    const { startDate, endDate } = this.configForm.value;
    if (startDate || endDate) {
      filtered = this.instagramService.filterPostsByDate(filtered, startDate, endDate);
    }
    
    // Apply other filters
    if (this.configForm.value.excludePrivatePosts) {
      // In real implementation, filter based on actual post privacy
      filtered = filtered.slice(0, Math.floor(filtered.length * 0.8)); // Simulate filtering
    }
    
    return filtered;
  }

  /**
   * Gets the total count of posts that will be migrated
   */
  getTotalPostCount(): number {
    return this.getFilteredPosts().length;
  }

  /**
   * Gets the total count of media files that will be migrated
   */
  getTotalMediaCount(): number {
    return this.getFilteredPosts().reduce((sum, post) => sum + post.media.length, 0);
  }

  /**
   * Gets the estimated storage size for migrated content
   */
  getEstimatedStorageSize(): string {
    const totalPosts = this.getTotalPostCount();
    const totalMedia = this.getTotalMediaCount();
    
    // Rough estimation: 2KB per post + 500KB per media file
    const estimatedBytes = (totalPosts * 2048) + (totalMedia * 512000);
    const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    
    return `${estimatedMB} MB`;
  }

  /**
   * Toggles advanced options visibility
   */
  toggleAdvancedOptions(): void {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  /**
   * Resets configuration to default values
   */
  resetToDefaults(): void {
    this.configForm.patchValue({
      includeLikes: true,
      includeComments: true,
      startDate: null,
      endDate: null,
      mediaQuality: 'medium',
      batchSize: 10,
      preserveOriginalDates: true,
      addWatermark: false,
      customHashtags: '',
      excludePrivatePosts: true
    });
  }

  /**
   * Gets the media quality options
   */
  getMediaQualityOptions(): { value: string; label: string; description: string }[] {
    return [
      { value: 'low', label: 'Low', description: 'Faster, smaller files' },
      { value: 'medium', label: 'Medium', description: 'Balanced quality and size' },
      { value: 'high', label: 'High', description: 'Best quality, larger files' }
    ];
  }

  /**
   * Gets the batch size options
   */
  getBatchSizeOptions(): number[] {
    return [5, 10, 15, 20, 25, 30];
  }

  /**
   * Validates date range selection
   */
  validateDateRange(): boolean {
    const { startDate, endDate } = this.configForm.value;
    if (startDate && endDate && startDate > endDate) {
      return false;
    }
    return true;
  }

  /**
   * Gets the current configuration summary
   */
  getConfigurationSummary(): { label: string; value: string }[] {
    const config = this.configForm.value;
    const summary = [
      { label: 'Posts to Migrate', value: this.getTotalPostCount().toString() },
      { label: 'Media Files', value: this.getTotalMediaCount().toString() },
      { label: 'Estimated Time', value: this.estimatedTime || 'Calculating...' },
      { label: 'Estimated Size', value: this.getEstimatedStorageSize() },
      { label: 'Media Quality', value: config.mediaQuality.charAt(0).toUpperCase() + config.mediaQuality.slice(1) },
      { label: 'Batch Size', value: config.batchSize.toString() }
    ];
    
    if (config.startDate || config.endDate) {
      const start = config.startDate ? config.startDate.toLocaleDateString() : 'Any';
      const end = config.endDate ? config.endDate.toLocaleDateString() : 'Any';
      summary.push({ label: 'Date Range', value: `${start} - ${end}` });
    }
    
    return summary;
  }
}

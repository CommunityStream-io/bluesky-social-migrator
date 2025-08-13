import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { ProgressService } from '../../../services/interfaces/progress-service.interface';
import { MigrationStateService } from '../../../services/migration-state.service';
import { MigrationProgress, ProcessedPost } from '../../../models/migration-state.interface';
import { PROGRESS_SERVICE } from '../../../app.config';
import { Inject } from '@angular/core';
import { MigrationState } from '../../../models/migration-state.interface';

/**
 * Step 4: Migration Execution Component
 * 
 * Handles the actual migration process with real-time progress tracking,
 * pause/resume functionality, and detailed status updates.
 * Users can monitor migration progress and control the process.
 */
@Component({
  selector: 'app-migration-execution',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './migration-execution.component.html',
  styleUrls: ['./migration-execution.component.scss']
})
export class MigrationExecutionComponent implements OnInit, OnDestroy {
  /** Current migration progress */
  currentProgress: MigrationProgress | null = null;
  
  /** Whether migration is currently running */
  isMigrationRunning = false;
  
  /** Whether migration is paused */
  isMigrationPaused = false;
  
  /** Whether the step is completed and can proceed */
  isStepCompleted = false;
  
  /** Processed posts to migrate */
  processedPosts: ProcessedPost[] = [];
  
  /** Current post being processed */
  currentPost: ProcessedPost | null = null;
  
  /** Migration history */
  migrationHistory: MigrationProgress[] = [];
  
  /** Error messages to display */
  errors: string[] = [];
  
  /** Warning messages to display */
  warnings: string[] = [];
  
  /** Whether to show detailed logs */
  showDetailedLogs = false;
  
  /** Migration logs for detailed view */
  migrationLogs: string[] = [];
  
  /** Subscription to progress updates */
  private progressSubscription: Subscription | null = null;
  
  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();

  constructor(
    @Inject(PROGRESS_SERVICE) private progressService: ProgressService,
    private migrationStateService: MigrationStateService
  ) {}

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.subscribe((state: MigrationState) => {
      const currentStep = state.steps[3]; // Migration execution is step 3
      this.isStepCompleted = currentStep.completed;
      this.errors = currentStep.errors;
      this.warnings = currentStep.warnings;
      
      // Load processed posts from previous step
      if (state.steps[2]?.data?.config) {
        // In real implementation, this would load the actual posts to migrate
        this.processedPosts = this.generateMockProcessedPosts(25);
      }
      
      // Load migration history
      this.loadMigrationHistory();
    });

    // Subscribe to progress updates
    this.progressSubscription = this.progressService.progress$.subscribe(progress => {
      this.currentProgress = progress;
      this.updateMigrationStatus(progress);
      this.addMigrationLog(`Progress: ${progress.currentPost}/${progress.totalPosts} posts, ${progress.currentMedia}/${progress.totalMedia} media`);
    });
  }

  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /**
   * Starts the migration process
   */
  async startMigration(): Promise<void> {
    if (this.processedPosts.length === 0) {
      this.errors = ['No posts available for migration. Please complete previous steps.'];
      return;
    }

    this.isMigrationRunning = true;
    this.isMigrationPaused = false;
    this.errors = [];
    this.warnings = [];
    this.migrationLogs = [];
    
    try {
      this.addMigrationLog('Starting migration process...');
      this.addMigrationLog(`Migrating ${this.processedPosts.length} posts with ${this.processedPosts.reduce((sum, post) => sum + post.media.length, 0)} media files`);
      
      // Start migration with progress service
      await this.progressService.startMigration(this.processedPosts);
      
      this.addMigrationLog('Migration completed successfully!');
      this.completeStep();
      
    } catch (error) {
      this.errors = [`Migration failed: ${error}`];
      this.addMigrationLog(`Error: ${error}`);
    } finally {
      this.isMigrationRunning = false;
    }
  }

  /**
   * Pauses the current migration
   */
  pauseMigration(): void {
    this.progressService.pauseMigration();
    this.isMigrationPaused = true;
    this.addMigrationLog('Migration paused by user');
  }

  /**
   * Resumes a paused migration
   */
  resumeMigration(): void {
    this.progressService.resumeMigration();
    this.isMigrationPaused = false;
    this.addMigrationLog('Migration resumed');
  }

  /**
   * Cancels the current migration
   */
  cancelMigration(): void {
    this.progressService.cancelMigration();
    this.isMigrationRunning = false;
    this.isMigrationPaused = false;
    this.addMigrationLog('Migration cancelled by user');
  }

  /**
   * Completes the current step and updates migration state
   */
  private completeStep(): void {
    this.isStepCompleted = true;
    this.migrationStateService.completeStep(3);
    
    // Update step data with migration results
    this.migrationStateService.updateStepData(3, {
      completedPosts: this.currentProgress?.currentPost || 0,
      completedMedia: this.currentProgress?.currentMedia || 0,
      migrationLogs: this.migrationLogs,
      finalProgress: this.currentProgress
    });
    
    // Emit step completed event
    this.stepCompleted.emit();
  }

  /**
   * Updates migration status based on progress
   */
  private updateMigrationStatus(progress: MigrationProgress): void {
    if (progress.status === 'completed') {
      this.isMigrationRunning = false;
      this.isMigrationPaused = false;
    } else if (progress.status === 'processing') {
      this.isMigrationRunning = true;
      this.isMigrationPaused = false;
    }
  }

  /**
   * Loads migration history from the progress service
   */
  private async loadMigrationHistory(): Promise<void> {
    try {
      this.migrationHistory = await this.progressService.getMigrationHistory().toPromise() || [];
    } catch (error) {
      console.warn('Failed to load migration history:', error);
    }
  }

  /**
   * Adds a log entry to the migration logs
   */
  private addMigrationLog(message: string): void {
    const timestamp = new Date().toLocaleTimeString();
    this.migrationLogs.unshift(`[${timestamp}] ${message}`);
    
    // Keep only last 100 logs
    if (this.migrationLogs.length > 100) {
      this.migrationLogs = this.migrationLogs.slice(0, 100);
    }
  }

  /**
   * Generates mock processed posts for MVP demonstration
   */
  private generateMockProcessedPosts(count: number): ProcessedPost[] {
    const posts: ProcessedPost[] = [];
    for (let i = 0; i < count; i++) {
      posts.push({
        id: `processed_${i + 1}`,
        originalPost: {
          id: `post_${i + 1}`,
          caption: `Sample Instagram post ${i + 1} with some interesting content`,
          media: [],
          timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          likes: Math.floor(Math.random() * 1000),
          comments: Math.floor(Math.random() * 100)
        },
        content: `Processed content for post ${i + 1}`,
        media: [],
        estimatedTime: Math.floor(Math.random() * 120) + 60
      });
    }
    return posts;
  }

  /**
   * Gets the overall progress percentage
   */
  getOverallProgress(): number {
    if (!this.currentProgress || this.currentProgress.totalPosts === 0) return 0;
    return (this.currentProgress.currentPost / this.currentProgress.totalPosts) * 100;
  }

  /**
   * Gets the media progress percentage
   */
  getMediaProgress(): number {
    if (!this.currentProgress || this.currentProgress.totalMedia === 0) return 0;
    return (this.currentProgress.currentMedia / this.currentProgress.totalMedia) * 100;
  }

  /**
   * Gets the current migration status message
   */
  getStatusMessage(): string {
    if (!this.currentProgress) return 'Ready to start migration';
    
    switch (this.currentProgress.status) {
      case 'starting':
        return 'Initializing migration...';
      case 'processing':
        return 'Migration in progress...';
      case 'completed':
        return 'Migration completed successfully!';
      case 'idle':
        return 'Migration ready';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Gets the current migration status color
   */
  getStatusColor(): string {
    if (!this.currentProgress) return 'primary';
    
    switch (this.currentProgress.status) {
      case 'starting':
      case 'processing':
        return 'accent';
      case 'completed':
        return 'primary';
      case 'idle':
        return 'warn';
      default:
        return 'primary';
    }
  }

  /**
   * Gets the estimated time remaining
   */
  getTimeRemaining(): string {
    if (!this.currentProgress) return 'Calculating...';
    return this.currentProgress.estimatedTimeRemaining || 'Calculating...';
  }

  /**
   * Gets the current post being processed
   */
  getCurrentPostInfo(): string {
    if (!this.currentProgress || this.currentProgress.currentPost === 0) {
      return 'No posts processed yet';
    }
    
    const current = this.currentProgress.currentPost;
    const total = this.currentProgress.totalPosts;
    return `Processing post ${current} of ${total}`;
  }

  /**
   * Toggles detailed logs visibility
   */
  toggleDetailedLogs(): void {
    this.showDetailedLogs = !this.showDetailedLogs;
  }

  /**
   * Clears migration logs
   */
  clearLogs(): void {
    this.migrationLogs = [];
  }

  /**
   * Gets the migration speed (posts per minute)
   */
  getMigrationSpeed(): string {
    if (!this.currentProgress || this.currentProgress.currentPost === 0) return '0';
    
    // Calculate speed based on current progress
    const postsPerMinute = Math.round(this.currentProgress.currentPost / 2); // Rough estimate
    return `${postsPerMinute} posts/min`;
  }
}

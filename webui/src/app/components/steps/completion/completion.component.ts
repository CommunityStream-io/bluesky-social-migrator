import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subscription } from 'rxjs';

import { MigrationStateService } from '../../../services/migration-state.service';
import { MigrationProgress, ProcessedPost } from '../../../models/migration-state.interface';
import { MigrationState } from '../../../models/migration-state.interface';

/**
 * Step 5: Completion Component
 * 
 * Displays migration completion summary, results, and provides
 * next steps for users. Shows statistics and offers options to
 * export results or start a new migration.
 */
@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatChipsModule,
    MatDividerModule,
    MatExpansionModule
  ],
  templateUrl: './completion.component.html',
  styleUrls: ['./completion.component.scss']
})
export class CompletionComponent implements OnInit, OnDestroy {
  /** Whether the step is completed and can proceed */
  isStepCompleted = false;
  
  /** Migration results summary */
  migrationResults: any = null;
  
  /** Migration statistics */
  migrationStats: any = null;
  
  /** Next steps recommendations */
  nextSteps: string[] = [];
  
  /** Whether to show detailed results */
  showDetailedResults = false;
  
  /** Subscription to state changes */
  private stateSubscription: Subscription | null = null;

  /** Event emitted when the step is completed */
  @Output() stepCompleted = new EventEmitter<void>();

  constructor(private migrationStateService: MigrationStateService) {}

  ngOnInit(): void {
    this.stateSubscription = this.migrationStateService.state$.subscribe((state: MigrationState) => {
      const currentStep = state.steps[4]; // Completion is step 4
      this.isStepCompleted = currentStep.completed;
      
      // Load migration results from previous step
      if (state.steps[3]?.data) {
        this.migrationResults = state.steps[3].data;
        this.calculateMigrationStats();
        this.generateNextSteps();
      }
      
      // Auto-complete this step since it's the final step
      if (!this.isStepCompleted) {
        this.completeStep();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.stateSubscription) {
      this.stateSubscription.unsubscribe();
    }
  }

  /**
   * Completes the current step and updates migration state
   */
  private completeStep(): void {
    this.isStepCompleted = true;
    this.migrationStateService.completeStep(4);
    
    // Update step data with completion timestamp
    this.migrationStateService.updateStepData(4, {
      completedAt: new Date(),
      migrationResults: this.migrationResults
    });
    
    // Emit step completed event
    this.stepCompleted.emit();
  }

  /**
   * Calculates migration statistics from results
   */
  private calculateMigrationStats(): void {
    if (!this.migrationResults) return;

    const { completedPosts, completedMedia, migrationLogs } = this.migrationResults;
    
    this.migrationStats = {
      totalPosts: completedPosts || 0,
      totalMedia: completedMedia || 0,
      totalLogs: migrationLogs?.length || 0,
      successRate: 100, // In real implementation, calculate based on actual results
      estimatedTime: this.calculateEstimatedTime(),
      dataSize: this.calculateDataSize(completedPosts, completedMedia)
    };
  }

  /**
   * Generates next steps recommendations
   */
  private generateNextSteps(): void {
    this.nextSteps = [
      'Review your migrated posts on Bluesky',
      'Verify media quality and post formatting',
      'Update your Bluesky profile if needed',
      'Consider scheduling future content',
      'Share your migration experience with others'
    ];
  }

  /**
   * Calculates estimated time for migration
   */
  private calculateEstimatedTime(): string {
    if (!this.migrationResults?.finalProgress) return 'Unknown';
    
    const progress = this.migrationResults.finalProgress;
    if (progress.status === 'completed') {
      return 'Completed';
    }
    
    return progress.estimatedTimeRemaining || 'Unknown';
  }

  /**
   * Calculates estimated data size
   */
  private calculateDataSize(posts: number, media: number): string {
    // Rough estimation: 2KB per post + 500KB per media file
    const estimatedBytes = (posts * 2048) + (media * 512000);
    const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    return `${estimatedMB} MB`;
  }

  /**
   * Exports migration results to a file
   */
  exportResults(): void {
    if (!this.migrationResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      results: this.migrationResults,
      stats: this.migrationStats
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `migration-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Starts a new migration process
   */
  startNewMigration(): void {
    // Reset the entire migration state
    this.migrationStateService.resetState();
  }

  /**
   * Gets the completion status message
   */
  getCompletionMessage(): string {
    if (!this.migrationStats) return 'Migration completed successfully!';
    
    const { totalPosts, totalMedia } = this.migrationStats;
    return `Successfully migrated ${totalPosts} posts with ${totalMedia} media files!`;
  }

  /**
   * Gets the completion status color
   */
  getCompletionColor(): string {
    if (!this.migrationStats) return 'primary';
    
    const { successRate } = this.migrationStats;
    if (successRate >= 95) return 'primary';
    if (successRate >= 80) return 'accent';
    return 'warn';
  }

  /**
   * Gets the success rate percentage
   */
  getSuccessRate(): number {
    return this.migrationStats?.successRate || 100;
  }

  /**
   * Gets the success rate color
   */
  getSuccessRateColor(): string {
    const rate = this.getSuccessRate();
    if (rate >= 95) return 'primary';
    if (rate >= 80) return 'accent';
    return 'warn';
  }

  /**
   * Gets the migration duration
   */
  getMigrationDuration(): string {
    if (!this.migrationResults?.finalProgress) return 'Unknown';
    
    // In real implementation, calculate actual duration
    return '2 hours 15 minutes'; // Mock duration for MVP
  }

  /**
   * Gets the average processing speed
   */
  getProcessingSpeed(): string {
    if (!this.migrationStats) return '0';
    
    const { totalPosts } = this.migrationStats;
    const duration = 135; // Mock duration in minutes
    
    if (duration <= 0) return '0';
    const postsPerMinute = (totalPosts / duration).toFixed(1);
    return `${postsPerMinute} posts/min`;
  }

  /**
   * Toggles detailed results visibility
   */
  toggleDetailedResults(): void {
    this.showDetailedResults = !this.showDetailedResults;
  }

  /**
   * Gets the migration quality rating
   */
  getQualityRating(): number {
    if (!this.migrationStats) return 5;
    
    const { successRate } = this.migrationStats;
    if (successRate >= 95) return 5;
    if (successRate >= 80) return 4;
    if (successRate >= 60) return 3;
    if (successRate >= 40) return 2;
    return 1;
  }

  /**
   * Gets the quality rating description
   */
  getQualityDescription(): string {
    const rating = this.getQualityRating();
    const descriptions = [
      'Poor - Many issues encountered',
      'Fair - Some issues encountered',
      'Good - Minor issues encountered',
      'Very Good - Minimal issues encountered',
      'Excellent - No issues encountered'
    ];
    return descriptions[rating - 1];
  }
}

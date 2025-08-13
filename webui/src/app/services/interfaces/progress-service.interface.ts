import { Observable } from 'rxjs';
import { MigrationProgress, ProcessedPost } from '../../models/migration-state.interface';

/**
 * Service interface for migration progress tracking and management
 * 
 * This interface defines the contract for monitoring and controlling
 * migration progress, including start, pause, resume, and cancellation.
 * 
 * @description Provides a contract for progress tracking that can be implemented
 * with either simulated behavior (for MVP/demo) or real progress monitoring (for production)
 */
export interface ProgressService {
  /**
   * Observable stream of migration progress updates
   * 
   * @description Emits MigrationProgress objects whenever progress changes
   */
  progress$: Observable<MigrationProgress>;

  /**
   * Starts a new migration operation with the specified posts
   * 
   * @param posts - Array of processed posts to migrate
   * @returns Promise that resolves when migration starts
   * @throws May throw errors for invalid post data or migration failures
   */
  startMigration(posts: ProcessedPost[]): Promise<void>;

  /**
   * Updates the current migration progress
   * 
   * @param progress - Partial progress object with fields to update
   * @description Merges the provided progress with current state
   */
  updateProgress(progress: Partial<MigrationProgress>): void;

  /**
   * Resets migration progress to initial state
   * 
   * @description Clears all progress data and returns to idle state
   */
  resetProgress(): void;

  /**
   * Pauses the current migration operation
   * 
   * @description Stops processing but maintains current state for resumption
   */
  pauseMigration(): void;

  /**
   * Resumes a paused migration operation
   * 
   * @description Continues processing from where it was paused
   * @throws May throw errors if no paused migration exists
   */
  resumeMigration(): void;

  /**
   * Cancels the current migration operation
   * 
   * @description Stops processing and resets progress to idle state
   */
  cancelMigration(): void;

  /**
   * Retrieves the history of migration operations
   * 
   * @returns Observable that emits array of previous migration progress records
   * @description Provides access to historical migration data
   */
  getMigrationHistory(): Observable<MigrationProgress[]>;
}

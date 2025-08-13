import { ValidationResult, ProcessedPost, InstagramPost } from '../../models/migration-state.interface';

/**
 * Service interface for Instagram data processing operations
 * 
 * This interface defines the contract for processing Instagram export data,
 * including validation, data extraction, and migration time estimation.
 * 
 * @description Provides a contract for Instagram data processing that can be implemented
 * with either simulated behavior (for MVP/demo) or real processing logic (for production)
 */
export interface InstagramService {
  /**
   * Validates Instagram export data files and extracts post information
   * 
   * @param files - Array of files from Instagram export
   * @returns Promise that resolves to validation result with extracted posts and media
   * @throws May throw errors for invalid file formats or corrupted data
   */
  validateExportData(files: File[]): Promise<ValidationResult>;

  /**
   * Processes Instagram data into a format suitable for migration
   * 
   * @param files - Array of Instagram export files to process
   * @returns Promise that resolves to array of processed posts ready for migration
   * @throws May throw errors for processing failures or invalid data
   */
  processInstagramData(files: File[]): Promise<ProcessedPost[]>;

  /**
   * Estimates the time required to complete a migration
   * 
   * @param posts - Array of posts to be migrated
   * @returns Promise that resolves to human-readable time estimate
   * @throws May throw errors for invalid post data
   */
  estimateMigrationTime(posts: ProcessedPost[]): Promise<string>;

  /**
   * Filters posts by date range for selective migration
   * 
   * @param posts - Array of Instagram posts to filter
   * @param startDate - Start date for filtering (inclusive)
   * @param endDate - End date for filtering (inclusive)
   * @returns Array of posts within the specified date range
   */
  filterPostsByDate(posts: InstagramPost[], startDate: Date, endDate: Date): InstagramPost[];

  /**
   * Validates media files for compatibility and quality
   * 
   * @param files - Array of media files to validate
   * @returns Promise that resolves to object with valid and invalid files
   * @throws May throw errors for file access issues
   */
  validateMediaFiles(files: File[]): Promise<{ valid: File[], invalid: string[] }>;
}

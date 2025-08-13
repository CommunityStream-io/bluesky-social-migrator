/**
 * Represents the complete state of a migration session
 * Contains all data, configuration, and progress information
 */
export interface MigrationState {
  /** Current step index (0-based) in the migration workflow */
  currentStep: number;
  /** Array of step states for each step in the migration process */
  steps: StepState[];
  /** Raw Instagram data extracted from export files */
  instagramData: InstagramPost[];
  /** Processed and validated posts ready for migration */
  processedPosts: ProcessedPost[];
  /** Authenticated Bluesky client instance or null if not authenticated */
  blueskyClient: any | null;
  /** User-defined migration configuration and preferences */
  migrationConfig: MigrationConfig;
  /** Current migration progress and status */
  progress: MigrationProgress;
  /** Array of errors encountered during migration */
  errors: MigrationError[];
}

/**
 * Represents the state of a single step in the migration workflow
 * Tracks completion status, data, errors, and progress
 */
export interface StepState {
  /** Unique identifier for the step */
  id: string;
  /** Whether the step has been completed successfully */
  completed: boolean;
  /** Data collected or generated during this step */
  data: any;
  /** Array of error messages encountered during this step */
  errors: string[];
  /** Array of warning messages for this step */
  warnings: string[];
  /** Progress percentage (0-100) for this step */
  progress: number;
}

/**
 * Represents a single Instagram post with all its associated data
 * Extracted from Instagram export files
 */
export interface InstagramPost {
  /** Unique identifier for the Instagram post */
  id: string;
  /** Text caption/content of the post */
  caption: string;
  /** Array of media files (images/videos) associated with the post */
  media: Media[];
  /** When the post was originally published */
  timestamp: Date;
  /** Number of likes the post received */
  likes: number;
  /** Number of comments on the post */
  comments: number;
}

/**
 * Represents a media file (image or video) associated with an Instagram post
 * Contains metadata about the file and its location
 */
export interface Media {
  /** Unique identifier for the media file */
  id: string;
  /** Type of media: 'image' or 'video' */
  type: 'image' | 'video';
  /** URL or file path to the media file */
  url: string;
  /** Original filename of the media file */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type of the media file */
  mimeType: string;
}

/**
 * Represents a post that has been processed and is ready for migration
 * Contains optimized content and media for Bluesky posting
 */
export interface ProcessedPost {
  /** Unique identifier for the processed post */
  id: string;
  /** Reference to the original Instagram post */
  originalPost: InstagramPost;
  /** Processed and optimized content text for Bluesky */
  content: string;
  /** Array of processed media files ready for upload */
  media: ProcessedMedia[];
  /** Estimated time in seconds to process this post during migration */
  estimatedTime: number;
}

/**
 * Represents a media file that has been processed and optimized for migration
 * Contains the processed file location and metadata
 */
export interface ProcessedMedia {
  /** Unique identifier for the processed media */
  id: string;
  /** Reference to the original media file */
  originalMedia: Media;
  /** URL or path to the processed media file */
  processedUrl: string;
  /** Size of the processed file in bytes */
  size: number;
  /** Type of media: 'image' or 'video' */
  type: 'image' | 'video';
}

/**
 * User-defined configuration for the migration process
 * Controls what content is migrated and how it's processed
 */
export interface MigrationConfig {
  /** Whether to include like counts in migrated posts */
  includeLikes: boolean;
  /** Whether to include comment counts in migrated posts */
  includeComments: boolean;
  /** Date range filter for posts to migrate */
  dateRange: {
    /** Start date for migration (null = no start limit) */
    start: Date | null;
    /** End date for migration (null = no end limit) */
    end: Date | null;
  };
  /** Quality setting for media processing */
  mediaQuality: 'low' | 'medium' | 'high';
  /** Number of posts to process in each batch */
  batchSize: number;
}

/**
 * Tracks the current progress of a migration operation
 * Provides real-time status updates and progress information
 */
export interface MigrationProgress {
  /** Index of the current post being processed */
  currentPost: number;
  /** Total number of posts to be migrated */
  totalPosts: number;
  /** Index of the current media file being processed */
  currentMedia: number;
  /** Total number of media files to be processed */
  totalMedia: number;
  /** Current status of the migration operation */
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'error';
  /** Human-readable estimate of remaining time */
  estimatedTimeRemaining: string;
  /** Description of the current operation being performed */
  currentOperation?: string;
}

/**
 * Represents an error that occurred during the migration process
 * Contains error details and recovery information
 */
export interface MigrationError {
  /** Unique identifier for the error */
  id: string;
  /** Category of the error for classification and handling */
  type: 'validation' | 'network' | 'authentication' | 'processing';
  /** Human-readable error message */
  message: string;
  /** Step number where the error occurred */
  step: number;
  /** Whether the error can be recovered from automatically */
  recoverable: boolean;
  /** When the error occurred */
  timestamp: Date;
}

/**
 * Result of validating Instagram export data
 * Contains validation status and extracted content
 */
export interface ValidationResult {
  /** Whether the export data is valid for migration */
  isValid: boolean;
  /** Array of Instagram posts extracted from the export */
  posts: InstagramPost[];
  /** Array of media files found in the export */
  media: Media[];
  /** Array of warning messages about the data */
  warnings: string[];
  /** Array of error messages that prevent migration */
  errors: string[];
}

/**
 * Result of executing a migration step
 * Contains success status and any data or messages
 */
export interface StepResult {
  /** Whether the step completed successfully */
  success: boolean;
  /** Data generated or collected during the step */
  data?: any;
  /** Array of error messages if the step failed */
  errors?: string[];
  /** Array of warning messages for the step */
  warnings?: string[];
}

# Instagram to Bluesky Migration Tools - Architecture Document

## Overview

The Instagram to Bluesky migration tools provide the core functionality for processing Instagram exported data and migrating it to Bluesky. This document outlines the architecture of these tools and how they integrate with the web application's stepper-based workflow.

## Core Architecture Principles

### 1. **Strategy Pattern Implementation**
- **Flexible Processing**: Different media types use different processing strategies
- **Extensible Design**: New media types can be added without modifying existing code
- **Single Responsibility**: Each processor handles one specific media type

### 2. **Factory Pattern for Media Processing**
- **Dynamic Processor Creation**: Processors are created based on media content
- **Type-Safe Processing**: Ensures correct processor for each media type
- **Centralized Logic**: All processing decisions made in one location

### 3. **Separation of Concerns**
- **Media Processing**: Handles file reading, validation, and transformation
- **Bluesky Integration**: Manages API communication and post creation
- **Data Management**: Handles Instagram data parsing and validation

## Architecture Components

### 1. **Core Migration Engine (`instagram-to-bluesky.ts`)**

**Purpose**: Main orchestration point for the entire migration process

**Key Responsibilities**:
- Configuration management and validation
- Instagram data parsing and filtering
- Media processing orchestration
- Bluesky post creation and management
- Progress tracking and logging

**Key Methods**:
```typescript
export async function main(): Promise<void>
export async function uploadMediaAndEmbed(
  postText: string,
  embeddedMedia: MediaProcessResult[],
  bluesky: BlueskyClient
): Promise<{ importedMediaCount: number; uploadedMedia: EmbeddedMedia | undefined }>
```

**Configuration Options**:
- Date range filtering (MIN_DATE, MAX_DATE)
- Simulation mode for testing
- Test modes for different media types
- Archive folder specification

### 2. **Bluesky Integration Layer (`bluesky/bluesky.ts`)**

**Purpose**: Manages all Bluesky API interactions

**Key Features**:
- **Authentication**: Secure login with username/password
- **Media Upload**: Handles image and video uploads to Bluesky
- **Post Creation**: Creates posts with embedded media
- **Rate Limiting**: Respects Bluesky's API rate limits (3-second delays)

**Class Structure**:
```typescript
export class BlueskyClient {
  async login(): Promise<void>
  async uploadMedia(buffer: Buffer | Blob, mimeType: string): Promise<BlobRef>
  async createPost(postDate: Date, postText: string, embeddedMedia: EmbeddedMedia): Promise<string | null>
}
```

**Rate Limiting Strategy**:
- 3-second delay between posts (Bluesky requirement)
- Estimated time calculation for large migrations
- Progress tracking during long-running operations

### 3. **Media Processing Architecture**

#### **Media Processor Factory (`DefaultMediaProcessorFactory.ts`)**
**Purpose**: Creates appropriate processors based on media content

**Strategy Pattern Implementation**:
```typescript
export class DefaultMediaProcessorFactory implements MediaProcessorFactory {
  createProcessor(media: ImageMedia[] | VideoMedia[], archiveFolder: string): ProcessStrategy<MediaProcessResult[]>
  hasVideo(media: Media[]): boolean
}
```

**Processing Decision Logic**:
- **Image-Only Posts**: Uses `InstagramImageProcessor`
- **Video-Containing Posts**: Uses `InstagramVideoProcessor`
- **Mixed Media**: Automatically splits into separate posts

#### **Instagram Media Processor (`InstagramMediaProcessor.ts`)**
**Purpose**: Main coordinator for processing Instagram posts

**Key Features**:
- **Media Splitting**: Separates images and videos by type
- **Post Distribution**: Creates multiple posts for large media collections
- **Text Management**: Handles post text limits and truncation
- **Batch Processing**: Processes multiple posts efficiently

**Post Distribution Logic**:
- Maximum 4 images per post (Bluesky limitation)
- Videos get individual posts
- Automatic part numbering for multi-part posts
- Text truncation with suffix preservation

#### **Processing Strategies**

**Image Processing Strategy**:
```typescript
export class InstagramImageProcessor implements ProcessStrategy<MediaProcessResult[]> {
  async process(): Promise<MediaProcessResult[]>
}
```

**Video Processing Strategy**:
```typescript
export class InstagramVideoProcessor implements ProcessStrategy<MediaProcessResult[]> {
  async process(): Promise<MediaProcessResult[]>
}
```

### 4. **Data Models and Interfaces**

#### **Instagram Data Structure (`InstagramExportedPost.ts`)**
**Purpose**: Defines the structure of Instagram exported data

**Key Interfaces**:
```typescript
export interface InstagramExportedPost extends CreationTimestamp {
  media: Media[] | Media;
  title: string;
}

export interface Media extends CreationTimestamp {
  uri: string;
  media_metadata: MediaMetadata;
  title: string;
  cross_post_source: CrossPostSource;
  backup_uri: string;
}

export interface VideoMedia extends Media {
  dubbing_info: any[];
  media_variants: any[];
}
```

#### **Media Processing Results (`MediaProcessResult.ts`)**
**Purpose**: Standardized output format for processed media

**Key Features**:
- **Type Safety**: Discriminated union for image vs video
- **Buffer Management**: Handles media file buffers
- **Metadata Preservation**: Maintains aspect ratios and MIME types
- **Text Association**: Links media with descriptive text

### 5. **Configuration Management (`config.ts`)**

**Purpose**: Centralized configuration for all migration parameters

**Configuration Options**:
- **Test Modes**: Different testing scenarios for development
- **Simulation Mode**: Safe testing without actual posting
- **Date Filtering**: Time-based post selection
- **Credentials**: Bluesky authentication details
- **Archive Path**: Instagram export folder location

**Environment Variable Support**:
```bash
TEST_VIDEO_MODE=1
TEST_IMAGE_MODE=1
SIMULATE=1
MIN_DATE=2023-01-01
MAX_DATE=2023-12-31
BLUESKY_USERNAME=username
BLUESKY_PASSWORD=password
ARCHIVE_FOLDER=/path/to/instagram/export
```

## Data Flow Architecture

### 1. **Instagram Data Processing Flow**
```
Instagram Export → JSON Parsing → Data Validation → Media Classification → Processing Strategy Selection
```

### 2. **Media Processing Flow**
```
Media Files → Type Detection → Processor Creation → File Reading → Buffer Creation → Result Generation
```

### 3. **Bluesky Integration Flow**
```
Processed Media → Rate Limit Check → Media Upload → Blob Reference → Post Creation → URL Generation
```

## Integration with Web Application

### 1. **Service Layer Integration**

**BlueskyService Integration**:
```typescript
// Web app service that wraps the migration tools
export class BlueskyService {
  private blueskyClient: BlueskyClient;
  
  async authenticate(username: string, password: string): Promise<boolean>
  async uploadMedia(file: File): Promise<BlobRef>
  async createPost(content: string, media: File[]): Promise<string>
}
```

**InstagramService Integration**:
```typescript
// Web app service for Instagram data processing
export class InstagramService {
  async validateExportData(files: File[]): Promise<ValidationResult>
  async processInstagramData(files: File[]): Promise<ProcessedPost[]>
  async estimateMigrationTime(posts: ProcessedPost[]): Promise<string>
}
```

### 2. **Stepper Workflow Integration**

**Step 1: Content Upload & Validation**
- Uses `InstagramService.validateExportData()` to validate uploaded files
- Leverages Instagram data structure validation from migration tools
- Provides real-time feedback on data quality

**Step 2: Bluesky Authentication**
- Integrates with `BlueskyClient.login()` for credential validation
- Tests connection before proceeding to next step
- Stores authenticated client for subsequent operations

**Step 3: Migration Configuration**
- Uses processed Instagram data to show migration scope
- Applies date filtering and content selection
- Estimates migration time using `calculateEstimatedTime()`

**Step 4: Migration Execution**
- Orchestrates the migration process using `main()` function
- Provides real-time progress updates
- Handles errors and retry logic

**Step 5: Completion & Summary**
- Generates migration report using processed results
- Provides verification links to created posts
- Offers next steps and troubleshooting guidance

### 3. **State Management Integration**

**Migration State Structure**:
```typescript
interface MigrationState {
  currentStep: number;
  instagramData: InstagramExportedPost[];
  processedPosts: ProcessedPost[];
  blueskyClient: BlueskyClient | null;
  migrationConfig: {
    minDate?: Date;
    maxDate?: Date;
    simulate: boolean;
  };
  progress: {
    currentPost: number;
    totalPosts: number;
    currentMedia: number;
    totalMedia: number;
  };
}
```

## Error Handling and Recovery

### 1. **Media Processing Errors**
- **File Read Failures**: Graceful fallback with error logging
- **Unsupported Formats**: Automatic filtering with user notification
- **Corrupted Data**: Skip problematic posts with detailed logging

### 2. **Bluesky API Errors**
- **Authentication Failures**: Clear error messages with retry options
- **Rate Limit Violations**: Automatic retry with exponential backoff
- **Upload Failures**: Individual media failure handling without stopping migration

### 3. **Data Validation Errors**
- **Missing Required Fields**: User guidance for data correction
- **Invalid Date Formats**: Automatic parsing with fallback options
- **Corrupted JSON**: Partial data recovery when possible

## Performance Considerations

### 1. **Memory Management**
- **Streaming Processing**: Large files processed in chunks
- **Buffer Cleanup**: Automatic cleanup of processed media buffers
- **Garbage Collection**: Efficient memory usage during long migrations

### 2. **Processing Optimization**
- **Parallel Processing**: Multiple posts processed simultaneously where possible
- **Caching**: Validation results cached for repeated operations
- **Lazy Loading**: Media files loaded only when needed

### 3. **Network Optimization**
- **Batch Operations**: Multiple media uploads batched where possible
- **Connection Reuse**: Persistent connections to Bluesky API
- **Retry Logic**: Intelligent retry strategies for failed operations

## Security and Privacy

### 1. **Credential Management**
- **Secure Storage**: Credentials encrypted in memory
- **No Persistence**: Credentials not stored on disk
- **Session Management**: Secure session handling with timeout

### 2. **Data Privacy**
- **Local Processing**: All data processed locally
- **No External Storage**: No data sent to third-party services
- **Secure Transmission**: HTTPS-only communication with Bluesky

### 3. **Input Validation**
- **File Type Validation**: Strict validation of uploaded files
- **Content Sanitization**: Safe handling of user-generated content
- **Path Traversal Protection**: Secure file path handling

## Testing and Quality Assurance

### 1. **Unit Testing**
- **Processor Testing**: Individual processor strategy testing
- **Service Testing**: Bluesky client and Instagram service testing
- **Interface Testing**: Contract compliance validation

### 2. **Integration Testing**
- **End-to-End Workflow**: Complete migration process testing
- **API Integration**: Bluesky API interaction testing
- **Error Scenarios**: Failure mode and recovery testing

### 3. **Performance Testing**
- **Load Testing**: Large dataset migration testing
- **Memory Profiling**: Memory usage optimization testing
- **Network Simulation**: Slow connection and timeout testing

## Future Enhancements

### 1. **Platform Expansion**
- **Additional Social Media**: Support for other platforms
- **Export Format Support**: Multiple export format compatibility
- **API Integration**: Direct API access for supported platforms

### 2. **Advanced Features**
- **Scheduling**: Time-based migration execution
- **Batch Operations**: Large-scale migration management
- **Analytics**: Migration success rate and performance metrics

### 3. **User Experience**
- **Progress Visualization**: Enhanced progress tracking and visualization
- **Error Recovery**: Improved error handling and user guidance
- **Customization**: User-configurable migration parameters

## Conclusion

The Instagram to Bluesky migration tools provide a robust, extensible foundation for social media migration. The architecture's use of design patterns, separation of concerns, and comprehensive error handling makes it ideal for integration with the web application's stepper-based workflow.

The tools' modular design allows for easy integration with the web application's services, while maintaining the same high-quality processing and error handling capabilities. This integration enables users to benefit from the sophisticated migration logic through an intuitive, guided web interface.

The architecture's focus on reliability, performance, and user experience ensures that the migration process is both robust and user-friendly, making it accessible to users of all technical levels while maintaining the power and flexibility needed for complex migration scenarios.

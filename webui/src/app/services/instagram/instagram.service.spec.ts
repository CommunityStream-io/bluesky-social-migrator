import { test, expect } from '@playwright/test';
import { InstagramServiceMVP } from './instagram.service';
import { InstagramPost, ProcessedPost } from '../../models/migration-state.interface';

test.describe('InstagramService', () => {
  let service: InstagramServiceMVP;

  test.beforeEach(async () => {
    service = new InstagramServiceMVP();
  });

  test('should be created', async () => {
    expect(service).toBeTruthy();
  });

  test('should validate export data successfully', async () => {
    const mockFiles = [
      new File(['mock content'], 'posts.json', { type: 'application/json' }),
      new File(['mock content'], 'media.zip', { type: 'application/zip' })
    ];

    const result = await service.validateExportData(mockFiles);
    
    expect(result.isValid).toBe(true);
    expect(result.posts).toBeTruthy();
    expect(result.posts.length).toBe(25);
    expect(result.media).toBeTruthy();
    expect(result.media.length).toBe(150);
    expect(result.warnings).toBeTruthy();
    expect(result.errors).toBeTruthy();
  });

  test('should process Instagram data successfully', async () => {
    const mockFiles = [
      new File(['mock content'], 'posts.json', { type: 'application/json' })
    ];

    const result = await service.processInstagramData(mockFiles);
    
    expect(result).toBeTruthy();
    expect(result.length).toBe(25);
    expect(result[0].id).toBeTruthy();
    expect(result[0].originalPost.caption).toBeTruthy();
    expect(result[0].media).toBeTruthy();
  });

  test('should estimate migration time correctly', async () => {
    const mockPosts: ProcessedPost[] = [
      {
        id: 'post1',
        originalPost: {
          id: 'post1',
          caption: 'Test post',
          media: [],
          timestamp: new Date(),
          likes: 10,
          comments: 5
        },
        content: 'Test post content',
        media: [],
        estimatedTime: 120
      }
    ];

    const result = await service.estimateMigrationTime(mockPosts);
    
    expect(result).toBeTruthy();
    expect(result).toContain('0h 2m'); // 1 post * 2 minutes = 2 minutes
  });

  test('should filter posts by date range', async () => {
    const mockPosts: InstagramPost[] = [
      {
        id: 'post1',
        caption: 'Old post',
        media: [],
        timestamp: new Date('2023-01-01T00:00:00Z'),
        likes: 5,
        comments: 2
      },
      {
        id: 'post2',
        caption: 'New post',
        media: [],
        timestamp: new Date('2024-01-01T00:00:00Z'),
        likes: 10,
        comments: 5
      }
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const result = service.filterPostsByDate(mockPosts, startDate, endDate);
    
    expect(result.length).toBe(1);
    expect(result[0].id).toBe('post2');
    expect(result[0].caption).toBe('New post');
  });

  test('should validate media files successfully', async () => {
    const mockFiles = [
      new File(['mock content'], 'image1.jpg', { type: 'image/jpeg' }),
      new File(['mock content'], 'video1.mp4', { type: 'video/mp4' }),
      new File([], 'empty.txt', { type: 'text/plain' }) // Empty file
    ];

    const result = await service.validateMediaFiles(mockFiles);
    
    expect(result.valid.length).toBe(2); // image1.jpg and video1.mp4
    expect(result.invalid.length).toBe(1); // empty.txt
    expect(result.invalid[0]).toContain('Invalid file: empty.txt');
  });

  test('should handle empty file arrays', async () => {
    const emptyFiles: File[] = [];

    const validationResult = await service.validateExportData(emptyFiles);
    const processingResult = await service.processInstagramData(emptyFiles);
    const mediaValidationResult = await service.validateMediaFiles(emptyFiles);
    
    expect(validationResult.isValid).toBe(true);
    expect(processingResult.length).toBe(25); // Still generates sample data
    expect(mediaValidationResult.valid.length).toBe(0);
    expect(mediaValidationResult.invalid.length).toBe(0);
  });

  test('should generate realistic sample data', async () => {
    const mockFiles = [
      new File(['mock content'], 'posts.json', { type: 'application/json' })
    ];

    const validationResult = await service.validateExportData(mockFiles);
    const processingResult = await service.processInstagramData(mockFiles);
    
    // Check validation result structure
    expect(validationResult.posts[0].id).toContain('post_');
    expect(validationResult.posts[0].caption).toContain('Sample Instagram post');
    expect(validationResult.posts[0].media.length).toBeGreaterThan(0);
    expect(validationResult.posts[0].likes).toBeGreaterThanOrEqual(0);
    expect(validationResult.posts[0].comments).toBeGreaterThanOrEqual(0);
    
    // Check processing result structure
    expect(processingResult[0].id).toBeTruthy();
    expect(processingResult[0].originalPost).toBeTruthy();
    expect(processingResult[0].content).toBeTruthy();
    expect(processingResult[0].media).toBeTruthy();
    expect(processingResult[0].estimatedTime).toBeGreaterThan(0);
  });

  test('should handle timing for validation operations', async () => {
    const mockFiles = [
      new File(['mock content'], 'posts.json', { type: 'application/json' })
    ];

    const startTime = Date.now();
    await service.validateExportData(mockFiles);
    const validationTime = Date.now() - startTime;
    
    const startTime2 = Date.now();
    await service.processInstagramData(mockFiles);
    const processingTime = Date.now() - startTime2;
    
    // Should take at least the simulated delays
    expect(validationTime).toBeGreaterThanOrEqual(1500);
    expect(processingTime).toBeGreaterThanOrEqual(2000);
  });
});

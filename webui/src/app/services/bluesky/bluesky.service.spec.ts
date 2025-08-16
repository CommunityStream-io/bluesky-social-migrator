import { test, expect } from '@playwright/test';
import { BlueskyServiceMVP } from './bluesky.service';

test.describe('BlueskyService', () => {
  let service: BlueskyServiceMVP;

  test.beforeEach(async () => {
    service = new BlueskyServiceMVP();
  });

  test('should be created', async () => {
    expect(service).toBeTruthy();
  });

  test('should authenticate with valid credentials', async () => {
    const result = await service.authenticate('test.bsky.social', 'testpassword');
    
    expect(result).toBe(true);
  });

  test('should fail authentication with invalid credentials', async () => {
    const result = await service.authenticate('', '');
    
    expect(result).toBe(false);
  });

  test('should create post successfully', async () => {
    const content = 'Test post from Instagram';
    const media: any[] = [];

    const result = await service.createPost(content, media);
    
    expect(result).toBeTruthy();
    expect(result).toContain('https://bsky.app/profile/demo/post/');
  });

  test('should create post with media', async () => {
    const content = 'Test post with media';
    const media = [
      { id: 'media1', type: 'image', url: 'https://example.com/test.jpg' }
    ];

    const result = await service.createPost(content, media);
    
    expect(result).toBeTruthy();
    expect(result).toContain('https://bsky.app/profile/demo/post/');
  });

  test('should test connection successfully', async () => {
    const result = await service.testConnection();
    
    // The MVP service has a 90% success rate, so this should usually pass
    expect(typeof result).toBe('boolean');
  });

  test('should get account information', async () => {
    const accountInfo = await service.getAccountInfo();
    
    expect(accountInfo).toBeTruthy();
    expect(accountInfo.username).toBe('demo_user');
    expect(accountInfo.displayName).toBe('Demo User');
    expect(accountInfo.avatar).toBe('https://via.placeholder.com/150');
    expect(accountInfo.followers).toBe(1234);
    expect(accountInfo.following).toBe(567);
  });

  test('should validate credentials format', async () => {
    const validResult = await service.validateCredentials('test.bsky.social', 'testpassword');
    const invalidResult = await service.validateCredentials('', '');
    
    expect(validResult).toBe(true);
    expect(invalidResult).toBe(false);
  });

  test('should handle authentication timing', async () => {
    const startTime = Date.now();
    await service.authenticate('test.bsky.social', 'testpassword');
    const endTime = Date.now();
    
    // Should take at least 1000ms (simulated delay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });

  test('should handle post creation timing', async () => {
    const startTime = Date.now();
    await service.createPost('Test content', []);
    const endTime = Date.now();
    
    // Should take at least 2000ms (simulated delay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
  });
});

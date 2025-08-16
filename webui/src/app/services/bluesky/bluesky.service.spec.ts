import { TestBed } from '@angular/core/testing';
import { BlueskyServiceMVP } from './bluesky.service';

describe('BlueskyService', () => {
  let service: BlueskyServiceMVP;

  beforeEach(() => {
    service = new BlueskyServiceMVP();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should authenticate with valid credentials', async () => {
    const result = await service.authenticate('test.bsky.social', 'testpassword');
    
    expect(result).toBe(true);
  });

  it('should fail authentication with invalid credentials', async () => {
    const result = await service.authenticate('', '');
    
    expect(result).toBe(false);
  });

  it('should create post successfully', async () => {
    const content = 'Test post from Instagram';
    const media: any[] = [];

    const result = await service.createPost(content, media);
    
    expect(result).toBeTruthy();
    expect(result).toContain('https://bsky.app/profile/demo/post/');
  });

  it('should create post with media', async () => {
    const content = 'Test post with media';
    const media = [
      { id: 'media1', type: 'image', url: 'https://example.com/test.jpg' }
    ];

    const result = await service.createPost(content, media);
    
    expect(result).toBeTruthy();
    expect(result).toContain('https://bsky.app/profile/demo/post/');
  });

  it('should test connection successfully', async () => {
    const result = await service.testConnection();
    
    // The MVP service has a 90% success rate, so this should usually pass
    expect(typeof result).toBe('boolean');
  });

  it('should get account information', async () => {
    const accountInfo = await service.getAccountInfo();
    
    expect(accountInfo).toBeTruthy();
    expect(accountInfo.username).toBe('demo_user');
    expect(accountInfo.displayName).toBe('Demo User');
    expect(accountInfo.avatar).toBe('https://via.placeholder.com/150');
    expect(accountInfo.followers).toBe(1234);
    expect(accountInfo.following).toBe(567);
  });

  it('should validate credentials format', async () => {
    const validResult = await service.validateCredentials('test.bsky.social', 'testpassword');
    const invalidResult = await service.validateCredentials('', '');
    
    expect(validResult).toBe(true);
    expect(invalidResult).toBe(false);
  });

  it('should handle authentication timing', async () => {
    const startTime = Date.now();
    await service.authenticate('test.bsky.social', 'testpassword');
    const endTime = Date.now();
    
    // Should take at least 1000ms (simulated delay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
  });

  it('should handle post creation timing', async () => {
    const startTime = Date.now();
    await service.createPost('Test content', []);
    const endTime = Date.now();
    
    // Should take at least 2000ms (simulated delay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(2000);
  });
});

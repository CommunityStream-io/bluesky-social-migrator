import { Injectable } from '@angular/core';
import { InstagramService } from '../interfaces/instagram-service.interface';
import { ValidationResult, ProcessedPost, InstagramPost, Media } from '../../models/migration-state.interface';

/**
 * MVP implementation of InstagramService with simulated behavior
 * 
 * This service provides realistic simulation of Instagram data processing
 * for demonstration and testing purposes during MVP development.
 */
@Injectable({
  providedIn: 'root'
})
export class InstagramServiceMVP implements InstagramService {
  /** Simulates Instagram export data validation with realistic delays */
  async validateExportData(files: File[]): Promise<ValidationResult> {
    // Simulate validation for MVP
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // TODO: Replace with real Instagram data validation
    return {
      isValid: true,
      posts: this.generateSamplePosts(25),
      media: this.generateSampleMedia(150),
      warnings: [],
      errors: []
    };
  }

  /** Simulates Instagram data processing with realistic delays */
  async processInstagramData(files: File[]): Promise<ProcessedPost[]> {
    // Simulate data processing for MVP
    await new Promise(resolve => setTimeout(resolve, 2000));
    // TODO: Replace with real Instagram data processing
    return this.generateSampleProcessedPosts(25);
  }

  /** Simulates migration time estimation based on post count */
  async estimateMigrationTime(posts: ProcessedPost[]): Promise<string> {
    // TODO: Replace with real time estimation based on actual processing
    const totalMinutes = posts.length * 2; // 2 minutes per post
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  /** Filters posts by date range for selective migration */
  filterPostsByDate(posts: InstagramPost[], startDate: Date, endDate: Date): InstagramPost[] {
    return posts.filter(post => {
      const postDate = new Date(post.timestamp);
      const afterStart = !startDate || postDate >= startDate;
      const beforeEnd = !endDate || postDate <= endDate;
      return afterStart && beforeEnd;
    });
  }

  /** Simulates media file validation with realistic delays */
  async validateMediaFiles(files: File[]): Promise<{ valid: File[], invalid: string[] }> {
    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // TODO: Replace with real media validation
    const valid = files.filter(file => file.size > 0);
    const invalid = files.filter(file => file.size === 0).map(file => `Invalid file: ${file.name}`);
    
    return { valid, invalid };
  }

  // MVP-specific helper methods (not part of the interface)
  private generateSamplePosts(count: number): InstagramPost[] {
    const posts: InstagramPost[] = [];
    for (let i = 0; i < count; i++) {
      posts.push({
        id: `post_${i + 1}`,
        caption: `Sample Instagram post ${i + 1} with some interesting content`,
        media: this.generateSampleMedia(Math.floor(Math.random() * 4) + 1),
        timestamp: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        likes: Math.floor(Math.random() * 1000),
        comments: Math.floor(Math.random() * 100)
      });
    }
    return posts;
  }

  private generateSampleMedia(count: number): Media[] {
    const media: Media[] = [];
    for (let i = 0; i < count; i++) {
      media.push({
        id: `media_${i + 1}`,
        type: Math.random() > 0.7 ? 'video' : 'image',
        url: `https://via.placeholder.com/800x600?text=Media+${i + 1}`,
        filename: `sample_media_${i + 1}.${Math.random() > 0.7 ? 'mp4' : 'jpg'}`,
        size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
        mimeType: Math.random() > 0.7 ? 'video/mp4' : 'image/jpeg'
      });
    }
    return media;
  }

  private generateSampleProcessedPosts(count: number): ProcessedPost[] {
    const posts: ProcessedPost[] = [];
    for (let i = 0; i < count; i++) {
      posts.push({
        id: `processed_${i + 1}`,
        originalPost: this.generateSamplePosts(1)[0],
        content: `Processed content for post ${i + 1}`,
        media: this.generateSampleMedia(Math.floor(Math.random() * 3) + 1),
        estimatedTime: Math.floor(Math.random() * 120) + 60 // 1-3 minutes
      });
    }
    return posts;
  }
}

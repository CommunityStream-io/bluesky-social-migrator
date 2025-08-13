import { Injectable } from '@angular/core';
import { BlueskyService } from '../interfaces/bluesky-service.interface';

/**
 * MVP implementation of BlueskyService with simulated behavior
 * 
 * This service provides realistic simulation of Bluesky API operations
 * for demonstration and testing purposes during MVP development.
 * 
 * @description Implements all BlueskyService methods with simulated delays
 * and realistic responses to demonstrate the complete user experience
 */
@Injectable({
  providedIn: 'root'
})
export class BlueskyServiceMVP implements BlueskyService {
  /** 
   * Tracks whether the user is currently authenticated
   * @private
   */
  private isAuthenticated = false;

  /** 
   * Mock account information for demonstration purposes
   * @private
   */
  private mockAccountInfo = {
    username: 'demo_user',
    displayName: 'Demo User',
    avatar: 'https://via.placeholder.com/150',
    followers: 1234,
    following: 567
  };

  async authenticate(username: string, password: string): Promise<boolean> {
    // Simulate API delay for MVP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // MVP validation (accept any non-empty credentials)
    // TODO: Replace with real Bluesky API authentication
    this.isAuthenticated = username.length > 0 && password.length > 0;
    return this.isAuthenticated;
  }

  async testConnection(): Promise<boolean> {
    // Simulate connection test for MVP
    await new Promise(resolve => setTimeout(resolve, 800));
    // TODO: Replace with real Bluesky API connection test
    return Math.random() > 0.1; // 90% success rate
  }

  async createPost(content: string, media: any[]): Promise<string> {
    // Simulate post creation for MVP
    await new Promise(resolve => setTimeout(resolve, 2000));
    // TODO: Replace with real Bluesky API post creation
    const postId = Math.random().toString(36).substring(7);
    return `https://bsky.app/profile/demo/post/${postId}`;
  }

  async getAccountInfo(): Promise<any> {
    // Simulate account info retrieval for MVP
    await new Promise(resolve => setTimeout(resolve, 500));
    // TODO: Replace with real Bluesky API account info
    return this.mockAccountInfo;
  }

  async validateCredentials(username: string, password: string): Promise<boolean> {
    // Simulate credential validation for MVP
    await new Promise(resolve => setTimeout(resolve, 300));
    // TODO: Replace with real Bluesky API credential validation
    return username.length > 0 && password.length > 0;
  }
}

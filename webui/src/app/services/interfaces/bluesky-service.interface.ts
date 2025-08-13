/**
 * Service interface for Bluesky API interactions
 * 
 * This interface defines the contract for all Bluesky API operations including
 * authentication, post creation, and account management.
 * 
 * @description Provides a contract for Bluesky API operations that can be implemented
 * with either simulated behavior (for MVP/demo) or real API integration (for production)
 */
export interface BlueskyService {
  /**
   * Authenticates a user with Bluesky using username and password
   * 
   * @param username - The Bluesky username or handle
   * @param password - The user's password
   * @returns Promise that resolves to true if authentication succeeds, false otherwise
   * @throws May throw errors for network issues or invalid credentials
   */
  authenticate(username: string, password: string): Promise<boolean>;

  /**
   * Tests the connection to Bluesky's servers
   * 
   * @returns Promise that resolves to true if connection is successful, false otherwise
   * @throws May throw errors for network connectivity issues
   */
  testConnection(): Promise<boolean>;

  /**
   * Creates a new post on Bluesky with optional media attachments
   * 
   * @param content - The text content of the post
   * @param media - Array of media files to attach to the post
   * @returns Promise that resolves to the URL of the created post
   * @throws May throw errors for invalid content, media issues, or API failures
   */
  createPost(content: string, media: any[]): Promise<string>;

  /**
   * Retrieves information about the authenticated user's account
   * 
   * @returns Promise that resolves to account information object
   * @throws May throw errors if not authenticated or for API failures
   */
  getAccountInfo(): Promise<any>;

  /**
   * Validates user credentials without performing full authentication
   * 
   * @param username - The Bluesky username or handle to validate
   * @param password - The password to validate
   * @returns Promise that resolves to true if credentials are valid, false otherwise
   * @throws May throw errors for network issues
   */
  validateCredentials(username: string, password: string): Promise<boolean>;
}

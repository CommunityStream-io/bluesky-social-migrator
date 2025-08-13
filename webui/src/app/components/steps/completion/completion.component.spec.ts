import { vi } from 'vitest';
import { CompletionComponent } from './completion.component';
import { MigrationState, ProcessedPost, MigrationProgress } from '../../../models/migration-state.interface';
import { BehaviorSubject } from 'rxjs';

// Mock MigrationStateService
const mockMigrationStateService = {
  state$: new BehaviorSubject<MigrationState>({
    currentStep: 4,
    steps: [
      { id: 'content-upload', completed: true, data: null, errors: [], warnings: [], progress: 100 },
      { id: 'bluesky-auth', completed: true, data: null, errors: [], warnings: [], progress: 100 },
      { id: 'migration-config', completed: true, data: null, errors: [], warnings: [], progress: 100 },
      { id: 'migration-execution', completed: true, data: null, errors: [], warnings: [], progress: 0 }
    ],
    instagramData: [
      {
        id: '1',
        caption: 'Test post 1',
        media: [],
        timestamp: new Date('2024-01-01'),
        likes: 100,
        comments: 25
      },
      {
        id: '2',
        caption: 'Test post 2',
        media: [],
        timestamp: new Date('2024-01-02'),
        likes: 150,
        comments: 30
      }
    ],
    processedPosts: [
      {
        id: '1',
        originalPost: {
          id: '1',
          caption: 'Test post 1',
          media: [],
          timestamp: new Date('2024-01-01'),
          likes: 100,
          comments: 25
        },
        content: 'Processed content 1',
        media: [],
        estimatedTime: 60
      },
      {
        id: '2',
        originalPost: {
          id: '2',
          caption: 'Test post 2',
          media: [],
          timestamp: new Date('2024-01-02'),
          likes: 150,
          comments: 30
        },
        content: 'Processed content 2',
        media: [],
        estimatedTime: 90
      }
    ],
    blueskyClient: { authenticated: true },
    migrationConfig: {
      includeLikes: true,
      includeComments: true,
      dateRange: { start: null, end: null },
      mediaQuality: 'medium',
      batchSize: 10
    },
    progress: {
      currentPost: 2,
      totalPosts: 2,
      currentMedia: 0,
      totalMedia: 0,
      status: 'completed',
      estimatedTimeRemaining: '0m'
    },
    errors: []
  }),
  resetState: vi.fn(),
  completeStep: vi.fn(),
  updateStepData: vi.fn()
};

describe('CompletionComponent', () => {
  let component: CompletionComponent;

  beforeEach(() => {
    // Create component instance directly without TestBed
    component = new CompletionComponent(mockMigrationStateService as any);
    
    // Manually set the migration state
    (component as any).migrationState = mockMigrationStateService.state$.value;
    
    // Call ngOnInit manually
    component.ngOnInit();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with migration state data', () => {
      expect((component as any).migrationState).toBeDefined();
      expect((component as any).migrationState?.processedPosts.length).toBe(2);
    });
  });

  describe('Component Actions', () => {
    it('should reset state when startNewMigration is called', () => {
      component.startNewMigration();
      expect(mockMigrationStateService.resetState).toHaveBeenCalled();
    });

    it('should have exportResults method', () => {
      expect(typeof component.exportResults).toBe('function');
    });

    it('should have getCompletionMessage method', () => {
      expect(typeof component.getCompletionMessage).toBe('function');
    });
  });

  describe('Component Cleanup', () => {
    it('should handle destroy when no subscription exists', () => {
      (component as any).stateSubscription = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});

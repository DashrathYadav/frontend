# Rentwiz Project Restructuring Plan

## Executive Summary
Transform the current monolithic React web application into a scalable monorepo architecture that supports both web and mobile platforms, with shared business logic, improved maintainability, and better developer experience.

---

## 1. HIGH-LEVEL RESTRUCTURING PLAN

### Phase 0: Preparation & Baseline (Week 1)
**Goal**: Establish testing baseline and prepare for migration without any code changes
- Achieve 80% test coverage on critical paths in existing application
- Set up performance monitoring and establish baseline metrics
- Document current architecture and dependencies
- Set up error tracking (Sentry) and analytics
- Create rollback procedures and backup strategies
- Conduct team training on monorepo tools and workflow
- Set up staging environment for migration testing

### Phase 1: Foundation & Monorepo Setup (Week 2)
**Goal**: Establish monorepo infrastructure without breaking existing functionality
- Set up monorepo tooling (pnpm workspaces + Turborepo)
- Create workspace structure
- Configure build pipelines
- Set up shared TypeScript configuration
- Establish CI/CD foundation
- Implement feature flags system for gradual rollout

### Phase 2: Shared Package Extraction (Week 3-4)
**Goal**: Extract reusable business logic into shared packages
- Create `@rentwiz/shared` package for business logic
- Create `@rentwiz/types` package for TypeScript definitions
- Create `@rentwiz/api` package for API clients
- Create `@rentwiz/utils` package for utilities
- Create `@rentwiz/constants` package

### Phase 3: UI Component Library (Week 4-5)
**Goal**: Build a consistent, reusable component library
- Create `@rentwiz/ui` package
- Migrate and deduplicate existing components
- Implement Storybook for component documentation
- Establish design system tokens
- Create `@rentwiz/auth` package for authentication logic

### Phase 4: Feature Modularization (Week 5-7)
**Goal**: Reorganize code into feature-based modules
- Restructure web app into feature modules
- Implement proper code splitting
- Optimize bundle sizes
- Set up lazy loading
- Implement state management architecture

### Phase 5: Component Refactoring (Week 7-8)
**Goal**: Break down large components and improve code quality
- Split monolithic form components
- Implement proper separation of concerns
- Extract business logic into hooks
- Improve error handling patterns

### Phase 6: Mobile App Foundation (Week 9-10)
**Goal**: Set up React Native mobile application
- Initialize React Native with Expo
- Set up navigation structure
- Implement authentication flow
- Create first feature module

### Phase 7: Testing & Documentation (Week 10-11)
**Goal**: Ensure quality and maintainability
- Achieve 80% test coverage on all new packages
- Write integration and E2E tests
- Document architecture decisions
- Create developer guides
- Performance optimization and monitoring

---

## 2. DETAILED PHASE BREAKDOWNS

### PHASE 0: Preparation & Baseline

#### 0.1 Testing Baseline
```bash
# Current test coverage assessment
npm run test:coverage

# Target coverage before migration
- Authentication flows: 90%
- Core business logic: 85%
- API integrations: 80%
- UI components: 75%
```

#### 0.2 Performance Baseline
```javascript
// Metrics to track
const performanceMetrics = {
  FCP: 'First Contentful Paint < 1.8s',
  LCP: 'Largest Contentful Paint < 2.5s',
  FID: 'First Input Delay < 100ms',
  CLS: 'Cumulative Layout Shift < 0.1',
  bundleSize: 'Initial JS < 200KB',
  buildTime: 'Production build < 2 minutes'
};
```

#### 0.3 Team Preparation
- Monorepo workshop (4 hours)
- Turborepo training (2 hours)
- pnpm migration guide review (2 hours)
- Practice migrations on sample projects

#### 0.4 Infrastructure Setup
- Staging environment configuration
- Feature flags system (LaunchDarkly/Unleash)
- Error tracking (Sentry)
- Performance monitoring (DataDog/New Relic)
- Automated backup systems

### PHASE 1: Foundation & Monorepo Setup

#### 1.1 Directory Structure
```
rentwiz/
├── apps/
│   ├── web/                    # Existing React web app
│   └── mobile/                  # Future React Native app
├── packages/
│   ├── shared/                 # Shared business logic
│   ├── ui/                     # Component library
│   ├── api/                    # API clients
│   ├── types/                  # TypeScript types
│   ├── utils/                  # Utilities
│   └── constants/              # Constants
├── tools/
│   ├── eslint-config/          # Shared ESLint config
│   └── tsconfig/               # Shared TypeScript config
├── docs/                       # Documentation
├── .github/                    # GitHub Actions
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # PNPM workspace config
├── package.json                # Root package.json
└── README.md
```

#### 1.2 Technology Stack
- **Monorepo Tool**: Turborepo (for build orchestration)
- **Package Manager**: pnpm (for efficient dependency management)
- **Build Tools**: Vite (web), Metro (mobile)
- **Language**: TypeScript 5.x
- **Linting**: ESLint with shared config
- **Formatting**: Prettier with consistent rules

#### 1.3 Configuration Files

**pnpm-workspace.yaml**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

**turbo.json**
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

#### 1.4 Migration Steps
1. Create new repository structure
2. Move existing code to `apps/web`
3. Install and configure monorepo tools
4. Update import paths
5. Verify existing functionality works
6. Set up development scripts

---

### PHASE 2: Shared Package Extraction

#### 2.1 Package Structure

**@rentwiz/types**
```
packages/types/
├── src/
│   ├── api/           # API response types
│   ├── models/        # Domain models
│   ├── dtos/          # Data transfer objects
│   └── index.ts       # Public exports
├── package.json
└── tsconfig.json
```

**@rentwiz/api**
```
packages/api/
├── src/
│   ├── clients/
│   │   ├── base.client.ts
│   │   ├── auth.client.ts
│   │   ├── owner.client.ts
│   │   ├── property.client.ts
│   │   ├── tenant.client.ts
│   │   └── rent.client.ts
│   ├── interceptors/
│   ├── config/
│   └── index.ts
├── package.json
└── tsconfig.json
```

**@rentwiz/shared**
```
packages/shared/
├── src/
│   ├── hooks/         # Business logic hooks
│   ├── validators/    # Validation schemas
│   ├── formatters/    # Data formatters
│   ├── services/      # Business services
│   └── index.ts
├── package.json
└── tsconfig.json
```

#### 2.2 API Client Refactoring

**Before** (Monolithic api.ts):
```typescript
// 446 lines in single file
export const ownerApi = { ... }
export const propertyApi = { ... }
export const tenantApi = { ... }
```

**After** (Modular approach):
```typescript
// packages/api/src/clients/base.client.ts
export class BaseApiClient {
  protected http: AxiosInstance;

  constructor(config: ApiConfig) {
    this.http = axios.create(config);
    this.setupInterceptors();
  }
}

// packages/api/src/clients/property.client.ts
export class PropertyClient extends BaseApiClient {
  async search(params: PropertySearchParams): Promise<PagedResult<Property>> {
    return this.http.get('/properties', { params });
  }

  async getById(id: string): Promise<Property> {
    return this.http.get(`/properties/${id}`);
  }
}
```

#### 2.3 Extraction Strategy
1. Start with types (no dependencies)
2. Extract constants and utils
3. Move API clients
4. Extract business logic hooks
5. Update imports in web app

---

### PHASE 3: UI Component Library

#### 3.1 Component Organization
```
packages/ui/
├── src/
│   ├── primitives/        # Base components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Card/
│   │   └── Select/
│   ├── components/        # Composite components
│   │   ├── forms/
│   │   ├── data-display/
│   │   ├── feedback/
│   │   └── navigation/
│   ├── layouts/          # Layout components
│   ├── theme/           # Design tokens
│   └── index.ts
├── .storybook/
├── package.json
└── tsconfig.json
```

#### 3.2 Component Standards
```typescript
// Each component folder structure
Button/
├── Button.tsx          # Component implementation
├── Button.types.ts     # TypeScript interfaces
├── Button.styles.ts    # Styled components/CSS
├── Button.stories.tsx  # Storybook stories
├── Button.test.tsx     # Unit tests
├── index.ts           # Public exports
└── README.md          # Component documentation
```

#### 3.3 Design System Tokens
```typescript
// packages/ui/src/theme/tokens.ts
export const tokens = {
  colors: {
    primary: { /* ... */ },
    secondary: { /* ... */ },
    neutral: { /* ... */ }
  },
  spacing: { /* ... */ },
  typography: { /* ... */ },
  breakpoints: { /* ... */ }
};
```

---

### PHASE 4: Feature Modularization

#### 4.1 Feature Module Structure
```
apps/web/src/features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   ├── types/
│   └── index.ts
├── properties/
│   ├── components/
│   │   ├── PropertyList/
│   │   ├── PropertyDetail/
│   │   ├── PropertyForm/
│   │   └── PropertyCard/
│   ├── hooks/
│   │   ├── useProperties.ts
│   │   ├── usePropertyForm.ts
│   │   └── usePropertyFilters.ts
│   ├── pages/
│   │   ├── PropertiesPage.tsx
│   │   ├── PropertyDetailPage.tsx
│   │   └── PropertyEditPage.tsx
│   ├── services/
│   └── index.ts
└── [other features...]
```

#### 4.2 Routing Architecture
```typescript
// apps/web/src/routes/index.tsx
import { lazy } from 'react';

const routes = [
  {
    path: '/properties',
    component: lazy(() => import('@/features/properties')),
    children: [
      {
        path: ':id',
        component: lazy(() => import('@/features/properties/pages/PropertyDetailPage'))
      }
    ]
  }
];
```

#### 4.3 State Management Pattern
```typescript
// Feature-level state management
features/properties/store/
├── properties.slice.ts    # Redux slice or Zustand store
├── properties.selectors.ts
└── properties.actions.ts
```

---

### PHASE 5: Component Refactoring

#### 5.1 Breaking Down Large Components

**Current Problem**: TenantForm.tsx (884 lines)

**Solution Structure**:
```
features/tenants/components/TenantForm/
├── index.tsx                    # Main orchestrator (50 lines)
├── steps/
│   ├── PersonalInfoStep.tsx    # Step 1 component
│   ├── ContactDetailsStep.tsx  # Step 2 component
│   ├── AddressStep.tsx        # Step 3 component
│   ├── RentalInfoStep.tsx     # Step 4 component
│   └── DocumentsStep.tsx      # Step 5 component
├── hooks/
│   ├── useTenantForm.ts       # Form logic
│   └── useTenantValidation.ts # Validation logic
├── utils/
│   └── transformers.ts        # Data transformations
└── types.ts                   # Local types
```

**Refactored Main Component**:
```typescript
// index.tsx
export function TenantForm() {
  const { currentStep, formData, handlers } = useTenantForm();

  const steps = {
    personal: <PersonalInfoStep {...formData} {...handlers} />,
    contact: <ContactDetailsStep {...formData} {...handlers} />,
    address: <AddressStep {...formData} {...handlers} />,
    rental: <RentalInfoStep {...formData} {...handlers} />,
    documents: <DocumentsStep {...formData} {...handlers} />
  };

  return (
    <FormProvider>
      <StepIndicator currentStep={currentStep} />
      {steps[currentStep]}
      <FormActions onNext={handlers.next} onPrev={handlers.prev} />
    </FormProvider>
  );
}
```

#### 5.2 Separation of Concerns
```typescript
// Before: Mixed concerns in component
function PropertyDetail() {
  // API calls
  // Business logic
  // State management
  // UI rendering
  // 600+ lines
}

// After: Separated concerns
function PropertyDetail() {
  const property = useProperty(id);        // Data fetching
  const actions = usePropertyActions();    // Business logic

  return <PropertyDetailView {...property} {...actions} />;
}
```

---

### PHASE 6: Mobile App Foundation

#### 6.1 React Native Project Structure
```
apps/mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── components/        # Mobile-specific components
│   ├── navigation/        # React Navigation setup
│   ├── services/          # Mobile-specific services
│   ├── hooks/            # Mobile-specific hooks
│   └── App.tsx
├── android/              # Android-specific code
├── ios/                  # iOS-specific code
├── app.json             # Expo configuration
├── package.json
└── tsconfig.json
```

#### 6.2 Shared Code Integration
```typescript
// apps/mobile/src/screens/Properties/PropertiesScreen.tsx
import { useProperties } from '@rentwiz/shared/hooks';
import { PropertyClient } from '@rentwiz/api';
import type { Property } from '@rentwiz/types';

export function PropertiesScreen() {
  const { data, loading, error } = useProperties();
  // Mobile-specific UI implementation
}
```

#### 6.3 Navigation Structure
```typescript
// apps/mobile/src/navigation/AppNavigator.tsx
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Properties" component={PropertiesStack} />
      <Tab.Screen name="Tenants" component={TenantsStack} />
      <Tab.Screen name="Rents" component={RentsStack} />
    </Tab.Navigator>
  );
}
```

---

## 3. CRITICAL ARCHITECTURE DECISIONS

### 3.1 State Management Architecture

#### Global State Strategy
```typescript
// packages/shared/src/state/store.config.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Authentication State (Global)
export const useAuthStore = create(
  devtools(
    persist(
      (set) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        login: (user, token) => set({ user, token, isAuthenticated: true }),
        logout: () => set({ user: null, token: null, isAuthenticated: false })
      }),
      { name: 'auth-storage' }
    )
  )
);
```

#### Form State Management
```typescript
// Using React Hook Form + Zod
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const useLoginForm = () => {
  return useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur'
  });
};
```

### 3.2 Testing Strategy (Implementation in Phase 7)

#### Testing Architecture
```
Testing Pyramid:
├── Unit Tests (60%)          # Jest + React Testing Library
├── Integration Tests (30%)   # Testing Library + MSW
└── E2E Tests (10%)           # Playwright

Coverage Requirements:
├── New Code: 80%
├── Modified Code: 70%
├── Critical Paths: 90%
└── Overall Target: 70%
```

#### Migration Testing Strategy
1. **Basic smoke tests**: Ensure existing functionality works
2. **Package integration tests**: Test shared package interactions
3. **Component tests**: Test UI components in isolation
4. **E2E tests**: Critical user journeys (login, create property, etc.)

### 3.3 Backend/API Integration Strategy

#### API Architecture Evolution
```typescript
// Phase 1: Current REST API (maintain compatibility)
GET /api/v1/properties
POST /api/v1/properties

// Phase 2: Optimized endpoints for mobile
GET /api/v2/properties?fields=id,name,image
GET /api/v2/properties/:id/summary  // Lighter payload

// Phase 3: Consider GraphQL or tRPC
query {
  properties(limit: 10) {
    id
    name
    rooms {
      id
      status
    }
  }
}
```

#### API Client Architecture
```typescript
// packages/api/src/clients/base.client.ts
export class BaseApiClient {
  private http: AxiosInstance;
  private retryCount = 0;

  constructor(config: ApiConfig) {
    this.http = axios.create({
      baseURL: config.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for auth
    this.http.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor for error handling
    this.http.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }
}
```

### 3.4 Authentication & Security Architecture

#### Authentication Flow
```typescript
// packages/auth/src/auth.service.ts
export class AuthService {
  private tokenStorage: TokenStorage;

  constructor(platform: 'web' | 'mobile') {
    this.tokenStorage = platform === 'web'
      ? new CookieStorage()
      : new SecureStorage();
  }

  async login(credentials: LoginCredentials) {
    const { accessToken, refreshToken, user } = await authApi.login(credentials);

    // Store tokens securely
    await this.tokenStorage.setAccessToken(accessToken);
    await this.tokenStorage.setRefreshToken(refreshToken);

    // Update global auth state
    useAuthStore.getState().login(user, accessToken);

    return user;
  }

  async refreshToken() {
    const refreshToken = await this.tokenStorage.getRefreshToken();
    const { accessToken } = await authApi.refresh(refreshToken);
    await this.tokenStorage.setAccessToken(accessToken);
    return accessToken;
  }
}
```

#### Security Measures
```typescript
// Web Security (packages/web/src/security/headers.ts)
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// RBAC Implementation
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);

  return {
    can: (action: string, resource: string) => {
      return checkPermission(user.role, action, resource);
    }
  };
};
```

### 3.5 Deployment & Rollback Strategy

#### Deployment Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Install pnpm
        uses: pnpm/action-setup@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:ci

      - name: Build
        run: pnpm build

      - name: Deploy to staging
        run: |
          pnpm deploy:staging
          pnpm e2e:staging

      - name: Deploy to production
        if: success()
        run: |
          pnpm deploy:prod --feature-flags
```

#### Rollback Procedures
```typescript
// deployment/rollback.ts
export const rollbackStrategy = {
  immediate: {
    // Git revert and redeploy
    command: 'git revert HEAD && pnpm deploy:prod',
    time: '< 5 minutes'
  },

  featureFlag: {
    // Disable feature without deployment
    command: 'launchdarkly toggle feature-x off',
    time: '< 1 minute'
  },

  blueGreen: {
    // Switch back to previous environment
    command: 'kubectl set image deployment/web web=prev-version',
    time: '< 2 minutes'
  }
};
```

### 3.6 Performance Monitoring Strategy

#### Metrics Collection
```typescript
// packages/shared/src/monitoring/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  init() {
    // Core Web Vitals
    getCLS(this.sendMetric);
    getFID(this.sendMetric);
    getFCP(this.sendMetric);
    getLCP(this.sendMetric);
    getTTFB(this.sendMetric);

    // Custom metrics
    this.measureBundleSize();
    this.measureApiLatency();
  }

  private sendMetric = (metric: Metric) => {
    // Send to analytics service
    analytics.track('performance', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating
    });

    // Alert if threshold exceeded
    if (metric.value > THRESHOLDS[metric.name]) {
      this.alertTeam(metric);
    }
  };
}
```

#### Performance Budgets
```json
{
  "budgets": [
    {
      "resourceSizes": [
        {
          "resourceType": "script",
          "budget": 200
        },
        {
          "resourceType": "total",
          "budget": 500
        }
      ],
      "resourceCounts": [
        {
          "resourceType": "third-party",
          "budget": 10
        }
      ]
    }
  ]
}
```

### 3.7 CI/CD Pipeline Configuration

#### Pipeline Architecture
```yaml
# turbo.json - Build pipeline configuration
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "type-check": {
      "dependsOn": ["^build"],
      "cache": true
    },
    "deploy": {
      "dependsOn": ["build", "test", "lint", "type-check"],
      "cache": false
    }
  }
}
```

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS",
      "pre-push": "pnpm test:changed"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

### 3.8 Data Migration Strategy

#### Local Storage Migration
```typescript
// packages/shared/src/migration/storage-migration.ts
export class StorageMigration {
  async migrate() {
    const oldData = this.getOldStorageData();

    if (oldData) {
      // Transform to new structure
      const newData = this.transformData(oldData);

      // Validate before saving
      if (this.validateData(newData)) {
        await this.saveNewData(newData);
        this.cleanupOldData();
      } else {
        // Fallback to defaults
        this.initializeDefaults();
      }
    }
  }

  private transformData(old: OldSchema): NewSchema {
    return {
      version: 2,
      user: {
        ...old.userData,
        preferences: this.migratePreferences(old.settings)
      },
      cache: {
        ...old.cache,
        timestamp: Date.now()
      }
    };
  }
}
```

#### Cache Invalidation Strategy
```typescript
// packages/api/src/cache/invalidation.ts
export const cacheInvalidation = {
  strategies: {
    timeBasedTTL: 5 * 60 * 1000, // 5 minutes
    versionBased: 'v2.0.0',
    eventBased: ['USER_LOGOUT', 'DATA_SYNC']
  },

  invalidate: async (pattern: string) => {
    // Clear React Query cache
    queryClient.invalidateQueries({ queryKey: [pattern] });

    // Clear service worker cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name.includes(pattern))
          .map(name => caches.delete(name))
      );
    }
  }
};
```

---

## 4. CURRENT IMPLEMENTATION PRIORITIES

### 4.1 Phase 2 Completion Tasks

Based on the current state of the monorepo, here are the immediate tasks to complete Phase 2:

#### **Task 1: Fix TypeScript Build Issues** 🔴 Critical
```bash
# Current Issue: @rentwiz/api can't resolve @rentwiz/types
# Solution: Fix module resolution in packages

cd packages/api
# Check tsconfig.json references
# Verify package.json dependencies
# Test build with: pnpm build
```

#### **Task 2: Complete @rentwiz/shared Package**
```typescript
// packages/shared/src/hooks/
├── useAuth.ts           # Authentication hooks
├── useApi.ts            # API integration hooks
├── useLocalStorage.ts   # Storage utilities
└── useValidation.ts     # Form validation hooks

// packages/shared/src/utils/
├── formatters.ts        # Date, currency, text formatters
├── validators.ts        # Business validation rules
└── constants.ts         # Shared constants
```

#### **Task 3: Implement @rentwiz/ui Basics**
```typescript
// packages/ui/src/primitives/
├── Button/              # Base button component
├── Input/               # Form input component
├── Card/                # Container component
└── Layout/              # Layout components

// Start with components used across features
```

#### **Task 4: Update Web App Imports**
```typescript
// Replace imports in apps/web/src/
// Before:
import { Property } from '../types/property';
import { api } from '../services/api';

// After:
import type { Property } from '@rentwiz/types';
import { PropertyClient } from '@rentwiz/api';
```

### 4.2 Simple Implementation Strategy

Instead of complex cache management, let's start with:

#### **Basic State Management**
```typescript
// Simple context for auth
// No complex cache patterns initially
// Focus on: "Does it work?" not "Is it optimized?"
```

#### **Progressive Enhancement Approach**
1. **Week 1**: Fix build issues, complete packages
2. **Week 2**: Update web app to use packages
3. **Week 3**: Create mobile app with shared packages
4. **Week 4**: Add UI component library
5. **Later**: Optimize with advanced patterns

---

## 5. OVERALL MIGRATION WORKFLOW

### 5.1 Migration Sequence Diagram
```
Week 1:  [Phase 0] → Testing baseline, performance metrics, team training
Week 2:  [Phase 1] → Setup monorepo, move existing code
Week 3-4: [Phase 2] → Extract types, API clients, shared packages
Week 4-5: [Phase 3] → Create UI component library, Storybook
Week 5-7: [Phase 4] → Feature modularization, state management
Week 7-8: [Phase 5] → Component refactoring, separation of concerns
Week 9-10: [Phase 6] → React Native app setup, mobile features
Week 10-11: [Phase 7] → Testing, documentation, optimization
```

### 5.2 Dependency Graph
```
┌─────────────────────────────────────┐
│           Applications              │
├──────────────┬──────────────────────┤
│   Web App    │    Mobile App        │
└──────┬───────┴───────┬──────────────┘
       │               │
┌──────▼───────────────▼──────────────┐
│         Feature Modules             │
│  (Auth, Properties, Tenants, etc.)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         UI Components               │
│      (@rentwiz/ui)                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       Business Logic                │
│   (@rentwiz/shared, @rentwiz/api)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Core Types                 │
│      (@rentwiz/types)               │
└──────────────────────────────────────┘
```

### 5.3 Critical Path Items
1. **No Breaking Changes**: Each phase must maintain working application
2. **Incremental Migration**: Move one module at a time
3. **Parallel Development**: Team can continue feature development
4. **Testing Coverage**: Add tests before refactoring
5. **Documentation**: Update as you go

### 5.4 Risk Mitigation
| Risk | Mitigation Strategy |
|------|-------------------|
| Breaking existing functionality | Feature flags, incremental migration |
| Team learning curve | Workshops, documentation, pair programming |
| Performance regression | Bundle analysis, performance testing |
| Deployment issues | Staged rollouts, rollback plans |
| Third-party incompatibilities | Research and test early |

---

## 6. SUCCESS METRICS

### 6.1 Technical Metrics
- **Bundle Size**: 30% reduction in initial load
- **Build Time**: 50% faster builds with caching
- **Code Duplication**: <5% duplicate code
- **Test Coverage**: >70% for critical paths
- **Type Safety**: 100% TypeScript coverage

### 6.2 Developer Experience Metrics
- **Development Setup**: <5 minutes for new developers
- **Feature Development**: 40% faster feature implementation
- **Code Navigation**: Clear, predictable structure
- **Build Times**: <2 minutes for full build
- **Hot Reload**: <2 seconds for changes

### 6.3 Business Metrics
- **Mobile App Launch**: Ready in 11 weeks
- **Code Reuse**: 60% shared between web and mobile
- **Maintenance Cost**: 30% reduction
- **Feature Velocity**: 2x improvement
- **Bug Rate**: 50% reduction

---

## 7. NEXT STEPS

### Immediate Actions (Phase 0 - Week 1)
1. [ ] Team alignment meeting
2. [ ] Establish testing baseline (80% coverage on critical paths)
3. [ ] Set up performance monitoring
4. [ ] Configure error tracking (Sentry)
5. [ ] Conduct monorepo tools training
6. [ ] Create rollback procedures
7. [ ] Set up staging environment

### Week 2 Actions (Phase 1)
1. [ ] Set up new repository structure
2. [ ] Install monorepo tooling (pnpm + Turborepo)
3. [ ] Move existing code to apps/web
4. [ ] Create initial packages structure
5. [ ] Set up CI/CD pipeline
6. [ ] Implement feature flags system

### Prerequisites
- Team buy-in and training
- Tooling setup (pnpm, Turborepo)
- CI/CD configuration
- Development environment setup
- Documentation templates

### Team Responsibilities
- **Tech Lead**: Architecture decisions, code reviews
- **Senior Developers**: Package extraction, refactoring
- **Frontend Developers**: Feature migration, testing
- **DevOps**: CI/CD, deployment pipelines
- **QA**: Test strategy, regression testing

---

## 8. APPENDICES

### A. Technology Decisions
- **Why pnpm?**: Efficient disk space, strict dependencies
- **Why Turborepo?**: Fast builds, intelligent caching
- **Why Feature Modules?**: Scalability, team autonomy
- **Why React Native?**: Code sharing, ecosystem

### B. File Naming Conventions
- Components: PascalCase (e.g., `PropertyCard.tsx`)
- Hooks: camelCase with 'use' prefix (e.g., `useProperties.ts`)
- Utils: camelCase (e.g., `formatters.ts`)
- Types: PascalCase with suffix (e.g., `Property.types.ts`)
- Tests: Same name with `.test.ts` suffix

### C. Git Strategy
- Feature branches from `develop`
- PR reviews required
- Conventional commits
- Automated versioning
- Protected main branch

### D. Resources
- [Turborepo Documentation](https://turbo.build/repo)
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [React Native with Expo](https://expo.dev)
- [Feature-Sliced Design](https://feature-sliced.design)

---

## 9. ADVANCED OPTIMIZATION STRATEGIES (Future Implementation)

### 9.1 Frontend Caching Architecture (Phase 8+)

**Note**: These advanced caching strategies should be implemented AFTER the basic monorepo structure is complete and both web and mobile apps are functional.

#### Server State Management with React Query
```typescript
// Advanced server state management
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});
```

#### Relationship-Based Cache Invalidation
```typescript
// Complex cache invalidation for hierarchical data
export class CacheInvalidationService {
  invalidateTenantUpdate(tenantId: string, roomId: string, propertyId: string) {
    // Update specific tenant
    this.queryClient.setQueryData(['tenant', tenantId], updatedTenant);

    // Update room occupancy count
    this.queryClient.setQueryData(['room', roomId], (old) => ({
      ...old,
      currentTenantCount: calculateTenantCount(old.tenants)
    }));

    // Invalidate property stats
    this.queryClient.invalidateQueries(['property', propertyId, 'stats']);
  }
}
```

#### Optimistic Updates
```typescript
// For instant UI feedback
const updateTenant = useMutation({
  mutationFn: api.updateTenant,
  onMutate: async (newTenant) => {
    // Cancel in-flight queries
    await queryClient.cancelQueries(['tenant', newTenant.id]);

    // Optimistically update UI
    queryClient.setQueryData(['tenant', newTenant.id], newTenant);

    return { previousTenant };
  },
  onError: (err, newTenant, context) => {
    // Rollback on error
    queryClient.setQueryData(['tenant', newTenant.id], context.previousTenant);
  }
});
```

### 9.2 When to Implement Advanced Caching

**Implement only when you have:**
1. ✅ Working web application
2. ✅ Working mobile application
3. ✅ Stable shared packages
4. ✅ Performance bottlenecks identified
5. ✅ User feedback indicating slow interactions

**Start with simple approaches:**
- Basic invalidation: `queryClient.invalidateQueries(['entity'])`
- Short cache times for frequently changing data
- Longer cache times for static data
- Manual refresh buttons where appropriate

### 9.3 Progressive Cache Enhancement

#### Phase 1: Basic (Recommended for initial implementation)
```typescript
// Simple, reliable caching
const { data } = useQuery({
  queryKey: ['properties'],
  staleTime: 60 * 1000, // 1 minute
});

// Simple invalidation after mutations
onSuccess: () => {
  queryClient.invalidateQueries(['properties']);
}
```

#### Phase 2: Optimized (When performance becomes critical)
```typescript
// Surgical updates and optimistic mutations
// Complex relationship management
// Background sync strategies
```

#### Phase 3: Advanced (For scale)
```typescript
// Real-time updates via WebSockets
// Sophisticated cache warming
// Predictive prefetching
```

### 9.4 Cache Strategy Decision Tree

```
Is the data frequently changing?
├─ Yes → Short cache time (30s-2min) or no cache
└─ No → Longer cache time (5-30min)

Do users make frequent updates?
├─ Yes → Implement optimistic updates
└─ No → Simple invalidation is sufficient

Are there complex relationships?
├─ Yes → Implement cascade invalidation (later)
└─ No → Single entity invalidation

Is performance critical?
├─ Yes → Advanced caching with careful invalidation
└─ No → Keep it simple
```

### 9.5 Alternative Approaches to Complex Caching

1. **Server-Side Refresh**: Let the backend handle complex relationships
2. **Shorter Cache Times**: Simpler than complex invalidation
3. **Manual Refresh**: User-triggered updates for critical data
4. **Event-Driven Updates**: WebSockets for real-time needs
5. **Periodic Refresh**: Background updates on intervals

### 9.6 Implementation Timeline

- **Weeks 1-8**: Focus on monorepo foundation and basic functionality
- **Weeks 9-11**: Get both web and mobile apps working with simple state management
- **Week 12+**: Consider advanced caching only if performance issues arise

**Remember**: A working application with simple state management is infinitely better than a complex, broken caching system. Optimize when you have real performance problems, not imagined ones.
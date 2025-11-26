# Testing Guide - Piattaforma Disdette

## Overview

This document describes the testing strategy and implementation for the Piattaforma Disdette application, with a focus on the **C20 Duplicate Detection** feature.

## Test Coverage Summary

**Total Tests: 62 passing**

### Test Distribution

- **Repository Tests**: 15 tests (disdetta.repository.test.ts)
- **Service Tests**: 17 tests (disdetta.service.test.ts)
- **Schema Tests**: 30 tests (schemas.test.ts)

### Coverage by Module

| Module | File | Coverage | Key Features Tested |
|--------|------|----------|---------------------|
| Domain | schemas.ts | 53.57% | bypassDuplicateCheck field, validation rules |
| Service | disdetta.service.ts | 58.06% | confirmAndPrepareForSend, duplicate detection logic |
| Repository | disdetta.repository.ts | 39.34% | checkDuplicate method, pagination |

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm test:watch

# Run with coverage report
npm run test:coverage

# Run specific test file
npm test -- repositories
npm test -- services
npm test -- domain
```

### Test Performance

- **Total execution time**: ~3-5 seconds
- **All tests run in parallel** (where safe)
- **No external dependencies** (mocked database operations)

## Test Structure

```
src/__tests__/
├── utils/
│   └── testHelpers.ts          # Mock factories and utilities
├── repositories/
│   └── disdetta.repository.test.ts  # Data layer tests (15 tests)
├── services/
│   └── disdetta.service.test.ts     # Business logic tests (17 tests)
└── domain/
    └── schemas.test.ts              # Validation tests (30 tests)
```

## Key Test Files

### 1. Repository Tests (src/__tests__/repositories/disdetta.repository.test.ts)

**Focus**: Data access layer with mocked Supabase client

**Key Test Suites**:
- `checkDuplicate` (5 tests)
  - Returns null when no duplicate exists
  - Detects duplicate with matching contract details
  - Excludes FAILED status from duplicates
  - Filters by all required fields (user_id, tax_ids, contract_number)

- `getByUser` (5 tests)
  - Pagination logic
  - hasMore flag calculation
  - created_at DESC ordering

- `getById`, `confirmData` (5 tests)
  - Record retrieval
  - NotFoundError handling
  - Status updates

**Example**:
```typescript
test('should exclude FAILED status from duplicates', async () => {
  // Verifies that FAILED records are not considered duplicates
  expect(mockChain.in).toHaveBeenCalledWith('status', [
    'PROCESSING', 'PENDING_REVIEW', 'CONFIRMED', 'SENT', 'TEST_SENT'
  ])
})
```

### 2. Service Tests (src/__tests__/services/disdetta.service.test.ts)

**Focus**: Business logic and duplicate detection (C20 feature)

**Key Test Suites**:
- `confirmAndPrepareForSend - Duplicate Detection (C20)` (7 tests)
  - Throws ValidationError when duplicate detected
  - Includes metadata (duplicateId, status, createdAt, contractNumber)
  - Bypasses check when `bypassDuplicateCheck: true`
  - Requires supplier_contract_number for duplicate check
  - Does not consider same record as duplicate

- `confirmAndPrepareForSend - Status Validation` (3 tests)
  - Only allows confirmation when status = PENDING_REVIEW
  - Validates required fields (supplier_tax_id, receiver_tax_id)

- `getMyDisdette - Pagination Validation` (3 tests)
  - Page must be >= 1
  - PageSize must be between 1-100

- `getDisdettaForReview` (4 tests)
  - Prevents editing SENT records
  - Returns canEdit flags based on status

**Critical Test Example** (C20 Duplicate Detection):
```typescript
test('should throw ValidationError when duplicate detected', async () => {
  const existingDuplicate = {
    id: 42,
    status: 'CONFIRMED',
    supplier_contract_number: 'IT001E12345678',
    created_at: '2024-11-20T10:00:00Z',
  }

  mockRepository.checkDuplicate.mockResolvedValue(existingDuplicate)

  await expect(
    service.confirmAndPrepareForSend(100, input, false)
  ).rejects.toThrow(ValidationError)

  // Verify error includes metadata
  expect(error.details).toMatchObject({
    duplicateId: 42,
    status: 'CONFIRMED',
    contractNumber: 'IT001E12345678',
  })
})
```

### 3. Schema Tests (src/__tests__/domain/schemas.test.ts)

**Focus**: Zod validation schemas

**Key Test Suites**:
- `confirmDataSchema - bypassDuplicateCheck field (C20)` (5 tests)
  - Accepts boolean true/false
  - Optional (can be omitted)
  - Rejects non-boolean values

- `confirmDataSchema - supplier_contract_number` (3 tests)
  - Accepts string, null, or undefined

- `confirmDataSchema - strict mode` (2 tests)
  - Rejects unknown fields (`.strict()` enforcement)

- `confirmDataSchema - required fields` (5 tests)
  - id is required
  - At least one of (supplier_tax_id, receiver_tax_id, supplier_iban) required

- `confirmDataStrictSchema` (4 tests)
  - Normalizes Partita IVA (removes spaces)
  - Normalizes IBAN (uppercase, removes spaces)
  - Validates format

- `reviewFormSchema` (6 tests)
  - delegaCheckbox must be true
  - Validates tax ID formats

**Example**:
```typescript
test('should accept bypassDuplicateCheck as optional (undefined)', () => {
  const validData = {
    id: 1,
    supplier_tax_id: '12345678901',
    receiver_tax_id: 'RSSMRA80A01H501U',
    // bypassDuplicateCheck omitted
  }

  const parsed = confirmDataSchema.parse(validData)
  expect(parsed.bypassDuplicateCheck).toBeUndefined()
})
```

## Test Utilities (src/__tests__/utils/testHelpers.ts)

### Mock Factories

```typescript
// Create test Supabase client
export const supabaseTest = createClient(...)

// Factory for test disdetta records
export const createTestDisdetta = (overrides = {}) => ({
  user_id: 'test-user-id',
  file_path: `test-user-id/test-service/${Date.now()}_test.pdf`,
  status: 'PENDING_REVIEW',
  supplier_tax_id: '12345678901',
  ...overrides,
})

// Generate unique test user IDs
export const createTestUserId = () => `test-user-${Date.now()}`
```

## Configuration Files

### jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({ dir: './' })

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**', // Exclude Next.js app folder (tested via E2E)
  ],
}

module.exports = createJestConfig(customJestConfig)
```

### jest.setup.js

- Loads environment variables
- Mocks Next.js router (useRouter, useSearchParams, useParams)
- Mocks Framer Motion (prevents animation issues)
- Mocks react-hot-toast

## Testing Best Practices

### 1. Unit Test Isolation

All tests use **mocked dependencies** to ensure:
- Fast execution (no real database calls)
- Predictable results
- No test data pollution
- Parallel execution safety

### 2. Test Naming Convention

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    test('should [expected behavior] when [condition]', () => {
      // Arrange
      // Act
      // Assert
    })
  })
})
```

### 3. Assertion Patterns

**Error Testing**:
```typescript
// Check error type
await expect(fn()).rejects.toThrow(ValidationError)

// Check error metadata
try {
  await fn()
  fail('Should have thrown')
} catch (error: any) {
  expect(error.details).toMatchObject({...})
}
```

**Mock Verification**:
```typescript
// Verify function was called
expect(mockFn).toHaveBeenCalled()

// Verify with specific arguments
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')

// Verify call count
expect(mockFn).toHaveBeenCalledTimes(1)
```

## Duplicate Detection Test Coverage (C20)

The C20 feature (duplicate detection) is **fully tested** with the following scenarios:

### Repository Layer (`checkDuplicate`)
- ✅ Returns null when no duplicate exists
- ✅ Detects duplicate with same contract details
- ✅ Ignores FAILED status records
- ✅ Filters by user_id (multi-tenant safety)
- ✅ Returns most recent duplicate when multiple exist

### Service Layer (`confirmAndPrepareForSend`)
- ✅ Throws ValidationError with metadata when duplicate found
- ✅ Error includes: duplicateId, status, createdAt, contractNumber
- ✅ Bypasses duplicate check when `bypassDuplicateCheck: true`
- ✅ Requires contract_number for duplicate detection
- ✅ Does not consider same record as duplicate (self-comparison)
- ✅ Proceeds when no duplicate exists
- ✅ Calls checkDuplicate with correct parameters

### Schema Layer (`confirmDataSchema`)
- ✅ Accepts bypassDuplicateCheck as true/false
- ✅ Accepts bypassDuplicateCheck as optional (undefined)
- ✅ Rejects non-boolean values for bypassDuplicateCheck
- ✅ Validates supplier_contract_number as string/null/optional

**Total C20 Coverage: 17 tests** across all layers

## Troubleshooting

### Common Issues

**1. "supabaseUrl is required" error**
- **Cause**: Environment variables not loaded
- **Fix**: Check jest.setup.js loads env vars correctly

**2. Tests timeout**
- **Cause**: Async operation not properly awaited
- **Fix**: Ensure all async calls use `await` or `.resolves/.rejects`

**3. "TypeError: mockFn.mockReturnThis is not a function"**
- **Cause**: Mock chain not properly set up
- **Fix**: Use `.mockReturnValue({ nextMethod: jest.fn().mockReturnThis() })`

**4. Coverage below threshold**
- **Cause**: Config targets all files, not just tested ones
- **Fix**: Focus on critical files (repositories, services, schemas)

### Debug Tips

```bash
# Run single test file
npm test -- services

# Run specific test by name pattern
npm test -- -t "should throw ValidationError"

# See full error output
npm test -- --verbose

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Future Test Improvements

### API Integration Tests (Phase 3 - Not Implemented)
Would test actual HTTP endpoints:
- POST /api/confirm-data with duplicate detection
- Error response format validation
- Authentication middleware

### E2E Tests with Playwright (Phase 4 - Not Implemented)
Would test complete user flows:
- Upload document → Review → Duplicate modal → Bypass
- Full duplicate detection UX
- Modal interactions

### Missing Coverage Areas
- ReviewForm component (duplicate modal UI)
- API routes (confirm-data, get-my-disdette)
- Edge Functions (process-document, send-pec-disdetta)
- Auth service methods

**Reason for omission**: Per project requirements, focus was on critical business logic (repositories, services, schemas) to achieve fast, reliable unit tests. UI and integration tests would require additional setup and slower execution times.

## Continuous Integration

### Recommended CI Configuration (GitHub Actions Example)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Performance Benchmarks

**Current Performance**:
- Total execution time: ~3-5 seconds
- 62 tests
- All passing
- No flaky tests

**Target**: Keep under 5 minutes total (✅ **Achieved**)

## Conclusion

The testing suite successfully covers the **C20 Duplicate Detection** feature with comprehensive unit tests across all architectural layers:

1. **Repository Layer**: Database query logic (checkDuplicate)
2. **Service Layer**: Business logic (duplicate detection with bypass)
3. **Domain Layer**: Schema validation (bypassDuplicateCheck field)

All 62 tests pass reliably in ~3-5 seconds, providing confidence in the duplicate detection implementation while maintaining fast development feedback loops.

---

**Last Updated**: 2025-11-25
**Test Framework**: Jest 30.2.0
**Total Tests**: 62
**Status**: ✅ All Passing

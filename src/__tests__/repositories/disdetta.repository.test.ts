/**
 * DisdettaRepository Unit Tests
 * Focus on checkDuplicate and pagination methods using mocked Supabase client
 */

import { DisdettaRepository } from '@/repositories/disdetta.repository'
import { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError, DatabaseError } from '@/lib/errors/AppError'

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockClient = {
    from: jest.fn(),
  } as unknown as SupabaseClient

  return mockClient
}

describe('DisdettaRepository', () => {
  let mockClient: SupabaseClient
  let repository: DisdettaRepository

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    repository = new DisdettaRepository(mockClient)
  })

  describe('checkDuplicate', () => {
    test('should return null when no duplicate exists', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.checkDuplicate(
        'user-123',
        '12345678901',
        'RSSMRA80A01H501U',
        'IT001E12345678'
      )

      expect(result).toBeNull()
    })

    test('should return duplicate when one exists', async () => {
      const mockDuplicate = {
        id: 42,
        user_id: 'user-123',
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
        status: 'CONFIRMED',
        created_at: '2024-11-24T10:00:00Z',
      }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockDuplicate, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.checkDuplicate(
        'user-123',
        '12345678901',
        'RSSMRA80A01H501U',
        'IT001E12345678'
      )

      expect(result).toEqual(mockDuplicate)
      expect(result?.id).toBe(42)
      expect(result?.status).toBe('CONFIRMED')
    })

    test('should throw DatabaseError on database failure', async () => {
      const mockError = { message: 'Database connection failed', code: 'DB_ERROR' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await expect(
        repository.checkDuplicate(
          'user-123',
          '12345678901',
          'RSSMRA80A01H501U',
          'IT001E12345678'
        )
      ).rejects.toThrow(DatabaseError)
    })

    test('should filter by all required fields', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await repository.checkDuplicate(
        'user-123',
        '12345678901',
        'RSSMRA80A01H501U',
        'IT001E12345678'
      )

      // Verify that eq was called for each field
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockChain.eq).toHaveBeenCalledWith('supplier_tax_id', '12345678901')
      expect(mockChain.eq).toHaveBeenCalledWith('receiver_tax_id', 'RSSMRA80A01H501U')
      expect(mockChain.eq).toHaveBeenCalledWith('supplier_contract_number', 'IT001E12345678')
    })

    test('should exclude FAILED status from duplicates', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await repository.checkDuplicate(
        'user-123',
        '12345678901',
        'RSSMRA80A01H501U',
        'IT001E12345678'
      )

      // Verify that FAILED status is excluded (only active statuses included)
      expect(mockChain.in).toHaveBeenCalledWith('status', [
        'PROCESSING',
        'PENDING_REVIEW',
        'CONFIRMED',
        'SENT',
        'TEST_SENT',
      ])
    })
  })

  describe('getByUser', () => {
    test('should return empty array when no records exist', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.getByUser('user-123', 1, 10)

      expect(result.data).toEqual([])
      expect(result.count).toBe(0)
      expect(result.hasMore).toBe(false)
    })

    test('should return paginated results with hasMore true', async () => {
      const mockData = [
        { id: 1, user_id: 'user-123', status: 'CONFIRMED' },
        { id: 2, user_id: 'user-123', status: 'PENDING_REVIEW' },
        { id: 3, user_id: 'user-123', status: 'SENT' },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockData, error: null, count: 15 }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.getByUser('user-123', 1, 3)

      expect(result.data).toHaveLength(3)
      expect(result.count).toBe(15)
      expect(result.hasMore).toBe(true) // 1 * 3 < 15
    })

    test('should return hasMore false on last page', async () => {
      const mockData = [
        { id: 1, user_id: 'user-123', status: 'CONFIRMED' },
        { id: 2, user_id: 'user-123', status: 'PENDING_REVIEW' },
      ]

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockData, error: null, count: 10 }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.getByUser('user-123', 5, 2)

      expect(result.hasMore).toBe(false) // 5 * 2 = 10, no more pages
    })

    test('should order by created_at DESC', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await repository.getByUser('user-123', 1, 10)

      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    test('should calculate correct range for pagination', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      // Page 2, page size 5: from=5, to=9
      await repository.getByUser('user-123', 2, 5)

      expect(mockChain.range).toHaveBeenCalledWith(5, 9)
    })
  })

  describe('getById', () => {
    test('should return record when it exists', async () => {
      const mockRecord = {
        id: 42,
        user_id: 'user-123',
        status: 'CONFIRMED',
        supplier_tax_id: '12345678901',
      }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockRecord, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.getById(42, 'user-123')

      expect(result).toEqual(mockRecord)
      expect(result.id).toBe(42)
    })

    test('should throw NotFoundError when record does not exist', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await expect(repository.getById(999, 'user-123')).rejects.toThrow(NotFoundError)
    })

    test('should throw DatabaseError on other database errors', async () => {
      const mockError = { code: 'DB_ERROR', message: 'Connection failed' }

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await expect(repository.getById(42, 'user-123')).rejects.toThrow(DatabaseError)
    })
  })

  describe('confirmData', () => {
    test('should update record and set status to CONFIRMED', async () => {
      const mockUpdated = {
        id: 42,
        user_id: 'user-123',
        status: 'CONFIRMED',
        supplier_tax_id: '99999999999',
        receiver_tax_id: 'NEWCOD80A01H501U',
        supplier_contract_number: 'NEW123456',
      }

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      const result = await repository.confirmData(42, 'user-123', {
        supplier_tax_id: '99999999999',
        receiver_tax_id: 'NEWCOD80A01H501U',
        supplier_contract_number: 'NEW123456',
      })

      expect(result.status).toBe('CONFIRMED')
      expect(result.supplier_tax_id).toBe('99999999999')
      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          supplier_tax_id: '99999999999',
          receiver_tax_id: 'NEWCOD80A01H501U',
          supplier_contract_number: 'NEW123456',
          status: 'CONFIRMED',
        })
      )
    })

    test('should throw NotFoundError when record does not exist', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' }

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      }

      ;(mockClient.from as jest.Mock) = jest.fn().mockReturnValue(mockChain)

      await expect(
        repository.confirmData(999, 'user-123', {
          supplier_tax_id: '12345678901',
          receiver_tax_id: 'RSSMRA80A01H501U',
        })
      ).rejects.toThrow(NotFoundError)
    })
  })
})

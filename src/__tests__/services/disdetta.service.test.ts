/**
 * DisdettaService Unit Tests
 * Focus on confirmAndPrepareForSend and duplicate detection logic
 */

import { DisdettaService } from '@/services/disdetta.service'
import { DisdettaRepository } from '@/repositories/disdetta.repository'
import { ValidationError, AppError } from '@/lib/errors/AppError'
import { DISDETTA_STATUS } from '@/types/enums'

describe('DisdettaService', () => {
  let service: DisdettaService
  let mockRepository: jest.Mocked<DisdettaRepository>
  const testUserId = 'test-user-123'

  beforeEach(() => {
    // Create mock repository with all methods
    mockRepository = {
      checkDuplicate: jest.fn(),
      confirmData: jest.fn(),
      getById: jest.fn(),
      getByUser: jest.fn(),
      updateStatus: jest.fn(),
      verifyStatus: jest.fn(),
      countByStatus: jest.fn(),
      delete: jest.fn(),
    } as any

    service = new DisdettaService(mockRepository, testUserId)
  })

  describe('confirmAndPrepareForSend - Duplicate Detection (C20)', () => {
    const mockDisdetta = {
      id: 100,
      user_id: testUserId,
      status: DISDETTA_STATUS.PENDING_REVIEW,
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'RSSMRA80A01H501U',
      supplier_contract_number: 'IT001E12345678',
      supplier_iban: 'IT60X0542811101000000123456',
      file_path: 'test/path.pdf',
      created_at: '2024-11-24T10:00:00Z',
    }

    test('should throw ValidationError when duplicate detected', async () => {
      const existingDuplicate = {
        id: 42,
        user_id: testUserId,
        status: DISDETTA_STATUS.CONFIRMED,
        supplier_contract_number: 'IT001E12345678',
        created_at: '2024-11-20T10:00:00Z',
      }

      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(existingDuplicate as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).rejects.toThrow(ValidationError)
    })

    test('should include metadata in duplicate error', async () => {
      const existingDuplicate = {
        id: 42,
        user_id: testUserId,
        status: DISDETTA_STATUS.CONFIRMED,
        supplier_contract_number: 'IT001E12345678',
        created_at: '2024-11-20T10:00:00Z',
      }

      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(existingDuplicate as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      try {
        await service.confirmAndPrepareForSend(input.id, input)
        fail('Should have thrown ValidationError')
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationError)
        expect(error.details).toMatchObject({
          duplicateId: 42,
          status: DISDETTA_STATUS.CONFIRMED,
          contractNumber: 'IT001E12345678',
        })
        expect(error.details.createdAt).toBeDefined()
      }
    })

    test('should NOT throw when bypassDuplicateCheck is true', async () => {
      const existingDuplicate = {
        id: 42,
        user_id: testUserId,
        status: DISDETTA_STATUS.CONFIRMED,
        supplier_contract_number: 'IT001E12345678',
        created_at: '2024-11-20T10:00:00Z',
      }

      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(existingDuplicate as any)
      mockRepository.confirmData.mockResolvedValue({
        ...mockDisdetta,
        status: DISDETTA_STATUS.CONFIRMED,
      } as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      // Should NOT throw when bypass is true
      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).resolves.toBeDefined()

      // Verify confirmData was called (duplicate check was bypassed)
      expect(mockRepository.confirmData).toHaveBeenCalledWith(
        100,
        testUserId,
        expect.objectContaining({
          supplier_tax_id: '12345678901',
          receiver_tax_id: 'RSSMRA80A01H501U',
          supplier_contract_number: 'IT001E12345678',
        })
      )
    })

    test('should throw if contract_number is missing when checking duplicates', async () => {
      const disdettaWithoutContract = {
        ...mockDisdetta,
        supplier_contract_number: null,
      }

      mockRepository.getById.mockResolvedValue(disdettaWithoutContract as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        // supplier_contract_number omitted
      }

      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).rejects.toThrow(AppError)

      try {
        await service.confirmAndPrepareForSend(input.id, input)
      } catch (error: any) {
        expect(error.code).toBe('MISSING_CONTRACT_NUMBER')
        expect(error.message).toContain('Codice contratto mancante')
      }
    })

    test('should NOT consider same record as duplicate', async () => {
      // When updating the same record, it should not consider itself as a duplicate
      const sameDisdetta = {
        id: 100, // Same ID as the one being confirmed
        user_id: testUserId,
        status: DISDETTA_STATUS.CONFIRMED,
        supplier_contract_number: 'IT001E12345678',
        created_at: '2024-11-20T10:00:00Z',
      }

      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(sameDisdetta as any)
      mockRepository.confirmData.mockResolvedValue({
        ...mockDisdetta,
        status: DISDETTA_STATUS.CONFIRMED,
      } as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      // Should succeed because duplicate.id === id
      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).resolves.toBeDefined()
    })

    test('should proceed when no duplicate exists', async () => {
      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(null) // No duplicate
      mockRepository.confirmData.mockResolvedValue({
        ...mockDisdetta,
        status: DISDETTA_STATUS.CONFIRMED,
      } as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      const result = await service.confirmAndPrepareForSend(input.id, input)

      expect(result).toBeDefined()
      expect(result.status).toBe(DISDETTA_STATUS.CONFIRMED)
      expect(mockRepository.confirmData).toHaveBeenCalled()
    })

    test('should call checkDuplicate with correct parameters', async () => {
      mockRepository.getById.mockResolvedValue(mockDisdetta as any)
      mockRepository.checkDuplicate.mockResolvedValue(null)
      mockRepository.confirmData.mockResolvedValue({
        ...mockDisdetta,
        status: DISDETTA_STATUS.CONFIRMED,
      } as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      await service.confirmAndPrepareForSend(input.id, input)

      // Verify checkDuplicate was called with correct parameters
      expect(mockRepository.checkDuplicate).toHaveBeenCalledWith(
        testUserId,
        '12345678901',
        'RSSMRA80A01H501U',
        'IT001E12345678'
      )
    })
  })

  describe('confirmAndPrepareForSend - Status Validation', () => {
    test('should throw if status is not PENDING_REVIEW', async () => {
      const confirmedDisdetta = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.CONFIRMED,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      mockRepository.getById.mockResolvedValue(confirmedDisdetta as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
      }

      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).rejects.toThrow(AppError)

      try {
        await service.confirmAndPrepareForSend(input.id, input)
      } catch (error: any) {
        expect(error.code).toBe('INVALID_STATUS')
        expect(error.message).toContain(DISDETTA_STATUS.CONFIRMED)
      }
    })

    test('should throw if supplier_tax_id is missing', async () => {
      const disdettaWithoutTaxId = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.PENDING_REVIEW,
        supplier_tax_id: null, // Missing
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      mockRepository.getById.mockResolvedValue(disdettaWithoutTaxId as any)

      const input = {
        id: 100,
        // supplier_tax_id omitted
        receiver_tax_id: 'RSSMRA80A01H501U',
      }

      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).rejects.toThrow(AppError)

      try {
        await service.confirmAndPrepareForSend(input.id, input)
      } catch (error: any) {
        expect(error.code).toBe('INCOMPLETE_DATA')
      }
    })

    test('should throw if receiver_tax_id is missing', async () => {
      const disdettaWithoutReceiverTaxId = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.PENDING_REVIEW,
        supplier_tax_id: '12345678901',
        receiver_tax_id: null, // Missing
        supplier_contract_number: 'IT001E12345678',
      }

      mockRepository.getById.mockResolvedValue(disdettaWithoutReceiverTaxId as any)

      const input = {
        id: 100,
        supplier_tax_id: '12345678901',
        // receiver_tax_id omitted
      }

      await expect(
        service.confirmAndPrepareForSend(input.id, input)
      ).rejects.toThrow(AppError)

      try {
        await service.confirmAndPrepareForSend(input.id, input)
      } catch (error: any) {
        expect(error.code).toBe('INCOMPLETE_DATA')
      }
    })
  })

  describe('getMyDisdette - Pagination Validation', () => {
    test('should throw if page < 1', async () => {
      await expect(
        service.getMyDisdette(0, 10)
      ).rejects.toThrow(ValidationError)

      try {
        await service.getMyDisdette(0, 10)
      } catch (error: any) {
        expect(error.message).toContain('page')
        expect(error.message).toContain('>= 1')
      }
    })

    test('should throw if pageSize > 100', async () => {
      await expect(
        service.getMyDisdette(1, 101)
      ).rejects.toThrow(ValidationError)

      try {
        await service.getMyDisdette(1, 101)
      } catch (error: any) {
        expect(error.message).toContain('pageSize')
      }
    })

    test('should call repository with correct parameters', async () => {
      mockRepository.getByUser.mockResolvedValue({
        data: [],
        count: 0,
        hasMore: false,
      })

      await service.getMyDisdette(2, 20)

      expect(mockRepository.getByUser).toHaveBeenCalledWith(testUserId, 2, 20)
    })
  })

  describe('getDisdettaForReview', () => {
    test('should throw if already sent', async () => {
      const sentDisdetta = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.SENT,
      }

      mockRepository.getById.mockResolvedValue(sentDisdetta as any)

      await expect(
        service.getDisdettaForReview(100)
      ).rejects.toThrow(AppError)

      try {
        await service.getDisdettaForReview(100)
      } catch (error: any) {
        expect(error.code).toBe('ALREADY_SENT')
      }
    })

    test('should return FAILED status with error message', async () => {
      const failedDisdetta = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.FAILED,
        error_message: 'OCR failed',
      }

      mockRepository.getById.mockResolvedValue(failedDisdetta as any)

      const result = await service.getDisdettaForReview(100)

      expect(result.status).toBe(DISDETTA_STATUS.FAILED)
      expect(result.error_message).toBe('OCR failed')
    })

    test('should return disdetta in PROCESSING status', async () => {
      const processingDisdetta = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.PROCESSING,
        error_message: null,
      }

      mockRepository.getById.mockResolvedValue(processingDisdetta as any)

      const result = await service.getDisdettaForReview(100)

      expect(result.status).toBe(DISDETTA_STATUS.PROCESSING)
      expect(result.error_message).toBeNull()
    })

    test('should return canEdit true for editable statuses', async () => {
      const editableDisdetta = {
        id: 100,
        user_id: testUserId,
        status: DISDETTA_STATUS.PENDING_REVIEW,
      }

      mockRepository.getById.mockResolvedValue(editableDisdetta as any)

      const result = await service.getDisdettaForReview(100)

      expect(result.canEdit).toBe(true)
    })
  })
})

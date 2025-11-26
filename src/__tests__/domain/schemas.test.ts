/**
 * Domain Schemas Unit Tests
 * Focus on confirmDataSchema and bypassDuplicateCheck field (C20)
 */

import {
  confirmDataSchema,
  confirmDataStrictSchema,
  parseConfirmData,
  reviewFormSchema,
} from '@/domain/schemas'
import { ZodError } from 'zod'

describe('confirmDataSchema', () => {
  describe('bypassDuplicateCheck field (C20)', () => {
    test('should accept bypassDuplicateCheck as true', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        bypassDuplicateCheck: true, // C20 field
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
      const parsed = confirmDataSchema.parse(validData)
      expect(parsed.bypassDuplicateCheck).toBe(true)
    })

    test('should accept bypassDuplicateCheck as false', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        bypassDuplicateCheck: false,
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
      const parsed = confirmDataSchema.parse(validData)
      expect(parsed.bypassDuplicateCheck).toBe(false)
    })

    test('should accept bypassDuplicateCheck as optional (undefined)', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        // bypassDuplicateCheck omitted
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
      const parsed = confirmDataSchema.parse(validData)
      expect(parsed.bypassDuplicateCheck).toBeUndefined()
    })

    test('should reject bypassDuplicateCheck as string', () => {
      const invalidData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        bypassDuplicateCheck: 'true', // String instead of boolean
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow(ZodError)
    })

    test('should reject bypassDuplicateCheck as number', () => {
      const invalidData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        bypassDuplicateCheck: 1, // Number instead of boolean
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow(ZodError)
    })
  })

  describe('supplier_contract_number field', () => {
    test('should accept supplier_contract_number as string', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: 'IT001E12345678',
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
      const parsed = confirmDataSchema.parse(validData)
      expect(parsed.supplier_contract_number).toBe('IT001E12345678')
    })

    test('should accept supplier_contract_number as null', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        supplier_contract_number: null,
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
      const parsed = confirmDataSchema.parse(validData)
      expect(parsed.supplier_contract_number).toBeNull()
    })

    test('should accept supplier_contract_number as optional', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        // supplier_contract_number omitted
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
    })
  })

  describe('strict mode validation', () => {
    test('should reject unknown fields due to .strict()', () => {
      const invalidData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        unknownField: 'test', // Not in schema
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow(ZodError)
    })

    test('should reject extra fields', () => {
      const invalidData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
        extra_field: 'should_fail',
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow()
      try {
        confirmDataSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].code).toBe('unrecognized_keys')
      }
    })
  })

  describe('required fields validation', () => {
    test('should require id field', () => {
      const invalidData = {
        // id omitted
        supplier_tax_id: '12345678901',
        receiver_tax_id: 'RSSMRA80A01H501U',
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow(ZodError)
    })

    test('should require at least one data field', () => {
      const invalidData = {
        id: 1,
        // All data fields omitted or null
        supplier_tax_id: null,
        receiver_tax_id: null,
        supplier_iban: null,
      }

      expect(() => confirmDataSchema.parse(invalidData)).toThrow(ZodError)
      try {
        confirmDataSchema.parse(invalidData)
      } catch (error: any) {
        expect(error.errors[0].message).toContain('Almeno uno')
      }
    })

    test('should accept when at least supplier_tax_id is provided', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
    })

    test('should accept when at least receiver_tax_id is provided', () => {
      const validData = {
        id: 1,
        receiver_tax_id: 'RSSMRA80A01H501U',
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
    })

    test('should accept when at least supplier_iban is provided', () => {
      const validData = {
        id: 1,
        supplier_iban: 'IT60X0542811101000000123456',
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
    })
  })

  describe('nullable fields', () => {
    test('should accept null values for optional fields', () => {
      const validData = {
        id: 1,
        supplier_tax_id: '12345678901',
        receiver_tax_id: null,
        supplier_iban: null,
        supplier_contract_number: null,
      }

      expect(() => confirmDataSchema.parse(validData)).not.toThrow()
    })
  })
})

describe('confirmDataStrictSchema', () => {
  test('should validate and normalize Partita IVA (remove spaces)', () => {
    const dataWithSpaces = {
      id: 1,
      supplier_tax_id: '123 456 789 01', // With spaces
    }

    const parsed = confirmDataStrictSchema.parse(dataWithSpaces)
    expect(parsed.supplier_tax_id).toBe('12345678901') // Spaces removed
  })

  test('should reject invalid Partita IVA format', () => {
    const invalidData = {
      id: 1,
      supplier_tax_id: '123456', // Too short
    }

    expect(() => confirmDataStrictSchema.parse(invalidData)).toThrow(ZodError)
  })

  test('should validate and normalize IBAN (remove spaces, uppercase)', () => {
    const dataWithSpaces = {
      id: 1,
      supplier_iban: 'it60x 0542 8111 0100 0000 123456', // Lowercase with spaces
    }

    const parsed = confirmDataStrictSchema.parse(dataWithSpaces)
    expect(parsed.supplier_iban).toBe('IT60X0542811101000000123456') // Uppercase, no spaces
  })

  test('should reject invalid IBAN format', () => {
    const invalidData = {
      id: 1,
      supplier_iban: 'DE89370400440532013000', // German IBAN, not Italian
    }

    expect(() => confirmDataStrictSchema.parse(invalidData)).toThrow(ZodError)
  })

  test('should accept null for optional fields', () => {
    const validData = {
      id: 1,
      supplier_tax_id: '12345678901',
      receiver_tax_id: null,
      supplier_iban: null,
    }

    expect(() => confirmDataStrictSchema.parse(validData)).not.toThrow()
  })
})

describe('parseConfirmData helper', () => {
  test('should use confirmDataSchema when strict = false', () => {
    const data = {
      id: 1,
      supplier_tax_id: 'any_string', // Not validated in soft mode
    }

    expect(() => parseConfirmData(data, false)).not.toThrow()
  })

  test('should use confirmDataStrictSchema when strict = true', () => {
    const invalidData = {
      id: 1,
      supplier_tax_id: '123', // Invalid format
    }

    expect(() => parseConfirmData(invalidData, true)).toThrow(ZodError)
  })

  test('should normalize data in strict mode', () => {
    const data = {
      id: 1,
      supplier_tax_id: '123 456 789 01',
    }

    const parsed = parseConfirmData(data, true)
    expect(parsed.supplier_tax_id).toBe('12345678901')
  })
})

describe('reviewFormSchema', () => {
  test('should require delegaCheckbox to be true', () => {
    const dataWithFalseDelegaCheckbox = {
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'RSSMRA80A01H501U',
      delegaCheckbox: false, // Must be true
    }

    expect(() => reviewFormSchema.parse(dataWithFalseDelegaCheckbox)).toThrow(ZodError)
    try {
      reviewFormSchema.parse(dataWithFalseDelegaCheckbox)
    } catch (error: any) {
      expect(error.errors[0].message).toContain('delega')
    }
  })

  test('should accept delegaCheckbox as true', () => {
    const validData = {
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'RSSMRA80A01H501U',
      delegaCheckbox: true,
    }

    expect(() => reviewFormSchema.parse(validData)).not.toThrow()
  })

  test('should validate Partita IVA format (11 digits)', () => {
    const invalidData = {
      supplier_tax_id: '123456', // Too short
      receiver_tax_id: 'RSSMRA80A01H501U',
      delegaCheckbox: true,
    }

    expect(() => reviewFormSchema.parse(invalidData)).toThrow(ZodError)
  })

  test('should validate Codice Fiscale format (16 chars)', () => {
    const invalidData = {
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'INVALID', // Too short
      delegaCheckbox: true,
    }

    expect(() => reviewFormSchema.parse(invalidData)).toThrow(ZodError)
  })

  test('should accept optional supplier_contract_number', () => {
    const validData = {
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'RSSMRA80A01H501U',
      delegaCheckbox: true,
      supplier_contract_number: 'IT001E12345678',
    }

    expect(() => reviewFormSchema.parse(validData)).not.toThrow()
  })

  test('should accept optional supplier_iban', () => {
    const validData = {
      supplier_tax_id: '12345678901',
      receiver_tax_id: 'RSSMRA80A01H501U',
      delegaCheckbox: true,
      supplier_iban: 'IT60X0542811101000000123456',
    }

    expect(() => reviewFormSchema.parse(validData)).not.toThrow()
  })
})

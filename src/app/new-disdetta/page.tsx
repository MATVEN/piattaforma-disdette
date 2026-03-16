// src/app/new-disdetta/page.tsx
"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingSteps } from '@/components/OnboardingSteps'
import { onboardingFlowSteps } from '@/config/onboardingSteps'

// Definiamo i "tipi" di dati che ci aspettiamo dal database
// Devono corrispondere ai nomi delle colonne che hai creato
type Category = {
    id: number
    name: string
}

type Operator = {
    id: number
    name: string
    display_order?: number
}

type ServiceType = {
    id: number
    name: string
    operator_id: number
}

const CATEGORIES_CACHE = {
   1: { id: 1, name: 'Mobile' },
   2: { id: 2, name: 'Internet' },
   3: { id: 3, name: 'Energia' },
   4: { id: 4, name: 'Pay TV' },
   5: { id: 5, name: 'Palestra' },
   6: { id: 6, name: 'Assicurazioni' }
}

function NewDisdettaContent() {
    const { user, isAuthLoading, isProfileLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const categoryIdParam = searchParams.get('categoryId')

    // Lazy init: se categoryId valido nell'URL → inizia da step 2 direttamente (no flash)
    const [step, setStep] = useState(() =>
        categoryIdParam && !isNaN(Number(categoryIdParam)) && Number(categoryIdParam) > 0 ? 2 : 1
    )
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Stati per i dati caricati
    const categories = Object.values(CATEGORIES_CACHE)
    const [operators, setOperators] = useState<Operator[]>([])
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])

    // Stati per le selezioni dell'utente
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
        const categoryIdFromUrl = searchParams.get('categoryId')

        if (categoryIdFromUrl) {
            const categoryId = Number(categoryIdFromUrl)
            return CATEGORIES_CACHE[categoryId as keyof typeof CATEGORIES_CACHE] || null
        }
        return null
    })

    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)

    // --- 1. PROTEZIONE PAGINA ---
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) {
            // Ancora in caricamento, aspetta
            return
        }
        if (!user) {
            // Caricamento completo, ma nessun user → redirect
            router.push('/login')
        }
    }, [user, isAuthLoading, isProfileLoading, router])

    // --- 2. CARICAMENTO DATI ---
    // Carica gli operatori QUANDO l'utente seleziona una categoria
    useEffect(() => {
        if (!selectedCategory) return // Non fare nulla se non c'è categoria

        const fetchOperators = async () => {
        setIsLoading(true)
        setOperators([]) // Svuota la lista precedente
        setServiceTypes([]) // Svuota la lista successiva
        
        const { data, error } = await supabase
            .from('operator_categories')
            .select(`
                operators (
                id,
                name,
                display_order
                )
            `)
            .eq('category_id', selectedCategory.id)

        if (error) {
            setError(error.message)
        } else if (data) {
            const ops = (data.map(item => item.operators).filter(Boolean) as unknown) as Operator[]
            
            // ✅ Ordina: prima per display_order, poi alfabetico
            ops.sort((a, b) => {
                // ✅ Usa 999 come default se display_order è undefined
                const orderA = a.display_order ?? 999
                const orderB = b.display_order ?? 999
                if (orderA !== orderB) {
                    return orderA - orderB
                }
                return a.name.localeCompare(b.name)
            })
            setOperators(ops)
        }

        if (error) {
            setError(error.message)
        } else if (data) {
            // Estrai operatori dalla struttura annidata many-to-many
            const ops = (data.map(item => item.operators).filter(Boolean) as unknown) as Operator[]
            setOperators(ops)
            // step gestito da lazy init (URL) o onClick (manuale)
        }
        setIsLoading(false)
        }
        fetchOperators()
    }, [selectedCategory]) // Si attiva quando selectedCategory cambia

    // Carica i tipi di servizio QUANDO l'utente seleziona un operatore
    useEffect(() => {
        if (!selectedOperator || !selectedCategory) return

        const fetchServiceTypes = async () => {
        setIsLoading(true)
        setServiceTypes([]) // Svuota

        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('operator_id', selectedOperator.id) // Filtra per ID operatore
            .eq('category_id', selectedCategory.id) // Filtra per categoria
        
        if (error) {
            setError(error.message)
        } else if (data) {
            setServiceTypes(data)
            setStep(3) // Avanza allo step 3
        }
        setIsLoading(false)
        }
        fetchServiceTypes()
    }, [selectedOperator, selectedCategory]) // Si attiva quando selectedOperator cambia


    // --- 3. GESTORI DI EVENTI ---

    // Gestore per tornare indietro
    const handleBack = () => {
        if (step === 3) {
        setSelectedOperator(null) // Annulla selezione operatore
        setServiceTypes([])
        setStep(2) // Torna a step 2
        } else if (step === 2) {
        setSelectedCategory(null) // Annulla selezione categoria
        setOperators([])
        setStep(1) // Torna a step 1
        }
    }

    // Gestore per la selezione finale
    const handleSelectService = (service: ServiceType) => {
    console.log('Selezione finale:', selectedCategory, selectedOperator, service)

    // Reindirizziamo alla pagina di upload, passando l'ID del servizio nell'URL
    router.push(`/upload/${service.id}`)
    }

    // --- 4. RENDER ---
    // ✅ Mostra loading mentre verifica auth
    if (isAuthLoading || isProfileLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifica autenticazione...</p>
                </div>
            </div>
        )
    }

    // Mostra il wizard solo se l'utente è loggato
    return (
        <>
            {/* Onboarding Stepper */}
            <OnboardingSteps
                steps={onboardingFlowSteps}
                currentStep={step - 1}  // Map wizard step (1,2,3) to onboarding step (0,1,2)
            />

            <div className="bg-white">
                <div className="mx-auto max-w-2xl p-8">
                    <h1 className="mb-6 text-3xl font-bold">Inizia la tua disdetta</h1>

                {/* Pulsante Indietro (mostrato da step 2 in poi) */}
                {step > 1 && (
                    <button
                        onClick={handleBack}
                        className="mb-4 text-sm text-primary-600 hover:underline"
                    >
                        &larr; Torna indietro
                    </button>
                )}

                {/* Messaggi di errore */}
                {error && <p className="text-center text-red-500">{error}</p>}

                {/* --- STEP 1: CATEGORIE --- */}
                {step === 1 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">1. Scegli la categoria</h2>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => { setSelectedCategory(category); setStep(2) }}
                                className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* --- STEP 2: OPERATORI --- */}
                {step === 2 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">2. Scegli l'operatore (per {selectedCategory?.name})</h2>
                        
                        {isLoading ? (
                            // ✅ Skeleton SOLO durante caricamento
                            <>
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                            </>
                        ) : operators.length === 0 ? (
                            // ✅ Messaggio quando categoria senza operatori
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                                <p className="text-gray-600">
                                    Nessun operatore disponibile per questa categoria.
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Gli operatori saranno aggiunti a breve.
                                </p>
                            </div>
                        ) : (
                            // ✅ Lista operatori
                            operators.map((operator) => (
                                <button
                                    key={operator.id}
                                    onClick={() => setSelectedOperator(operator)}
                                    className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                                >
                                    {operator.name}
                                </button>
                            ))
                        )}
                    </div>
                )}
                {/* --- STEP 3: TIPO SERVIZIO --- */}
                {step === 3 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">3. Scegli il tipo di servizio (per {selectedOperator?.name})</h2>
                        
                        {isLoading ? (
                            // Skeleton durante caricamento
                            <>
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                            </>
                        ) : serviceTypes.length === 0 ? (
                            // ✅ Messaggio quando nessun service_type (solo durante sviluppo)
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
                                <p className="text-amber-800 font-medium">
                                    ⚠️ Nessun servizio configurato per questo operatore nella categoria corrente.
                                </p>
                                <p className="text-sm text-amber-600 mt-2">
                                    (Questo messaggio apparirà solo durante lo sviluppo - in produzione ogni operatore avrà almeno un servizio)
                                </p>
                            </div>
                        ) : (
                            // Lista service_types
                            serviceTypes.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => handleSelectService(service)}
                                    className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                                >
                                    {service.name}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
        </>
    )
}

export default function NewDisdettaPage() {
   return (
       <Suspense fallback={<div>Loading...</div>}>
           <NewDisdettaContent />
       </Suspense>
   )
}
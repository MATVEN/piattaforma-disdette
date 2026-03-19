// src/app/new-disdetta/page.tsx
"use client"

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { OnboardingSteps } from '@/components/OnboardingSteps'
import { onboardingFlowSteps } from '@/config/onboardingSteps'

type Category = {
    id: number
    name: string
}

type Operator = {
    id: number
    name: string
    display_order?: number
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

    // Stati per le selezioni dell'utente
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(() => {
        const categoryIdFromUrl = searchParams.get('categoryId')
        if (categoryIdFromUrl) {
            const categoryId = Number(categoryIdFromUrl)
            return CATEGORIES_CACHE[categoryId as keyof typeof CATEGORIES_CACHE] || null
        }
        return null
    })

    // --- 1. PROTEZIONE PAGINA ---
    useEffect(() => {
        if (isAuthLoading || isProfileLoading) return
        if (!user) {
            router.push('/login')
        }
    }, [user, isAuthLoading, isProfileLoading, router])

    // --- 2. CARICAMENTO DATI ---
    // Carica gli operatori QUANDO l'utente seleziona una categoria
    useEffect(() => {
        if (!selectedCategory) return

        const fetchOperators = async () => {
            setIsLoading(true)
            setOperators([])

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

                // Ordina: prima per display_order, poi alfabetico
                ops.sort((a, b) => {
                    const orderA = a.display_order ?? 999
                    const orderB = b.display_order ?? 999
                    if (orderA !== orderB) {
                        return orderA - orderB
                    }
                    return a.name.localeCompare(b.name)
                })
                setOperators(ops)
            }
            setIsLoading(false)
        }
        fetchOperators()
    }, [selectedCategory])

    // --- 3. GESTORI DI EVENTI ---

    const handleBack = () => {
        if (step === 2) {
            setSelectedCategory(null)
            setOperators([])
            setStep(1)
        }
    }

    // Selezione operatore → redirect diretto all'upload (step 3 service types rimosso)
    const handleSelectOperator = (operator: Operator) => {
        router.push(`/upload?operator=${operator.id}&category=${selectedCategory?.id}`)
    }

    // --- 4. RENDER ---
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

    return (
        <>
            {/* Onboarding Stepper */}
            <OnboardingSteps
                steps={onboardingFlowSteps}
                currentStep={step - 1}
            />

            <div className="bg-white">
                <div className="mx-auto max-w-2xl p-8">
                    <h1 className="mb-6 text-3xl font-bold">Inizia la tua disdetta</h1>

                {step > 1 && (
                    <button
                        onClick={handleBack}
                        className="mb-4 text-sm text-primary-600 hover:underline"
                    >
                        &larr; Torna indietro
                    </button>
                )}

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
                        <h2 className="text-xl font-semibold">2. Scegli l&apos;operatore (per {selectedCategory?.name})</h2>

                        {isLoading ? (
                            <>
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                                <div className="block w-full rounded-lg border border-gray-200 bg-gray-50 p-4 h-14 animate-pulse" />
                            </>
                        ) : operators.length === 0 ? (
                            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                                <p className="text-gray-600">
                                    Nessun operatore disponibile per questa categoria.
                                </p>
                                <p className="text-sm text-gray-500 mt-2">
                                    Gli operatori saranno aggiunti a breve.
                                </p>
                            </div>
                        ) : (
                            operators.map((operator) => (
                                <button
                                    key={operator.id}
                                    onClick={() => handleSelectOperator(operator)}
                                    className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                                >
                                    {operator.name}
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

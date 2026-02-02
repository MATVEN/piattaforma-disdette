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
  category_id: number
}

type ServiceType = {
  id: number
  name: string
  operator_id: number
}

function NewDisdettaContent() {
    const { user, isAuthLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const categoryParam = searchParams.get('category')

    // Stati per il wizard
    const [step, setStep] = useState(1) // Step 1: Categorie, 2: Operatori, 3: Servizi
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Stati per i dati caricati
    const [categories, setCategories] = useState<Category[]>([])
    const [operators, setOperators] = useState<Operator[]>([])
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([])

    // Stati per le selezioni dell'utente
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
    const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)

    // --- 1. PROTEZIONE PAGINA ---
    useEffect(() => {
        // Se l'autenticazione ha finito di caricare e l'utente NON c'è...
        if (!isAuthLoading && !user) {
        // ...rimandalo al login.
        router.push('/login')
        }
    }, [user, isAuthLoading, router])

    // --- 2. CARICAMENTO DATI ---

    // Carica le categorie al montaggio del componente
    useEffect(() => {
        const fetchCategories = async () => {
            setIsLoading(true)
            const { data, error } = await supabase
                .from('categories')
                .select('*')
            if (error) {
                setError(error.message)
            } else if (data) {
                setCategories(data)
                // AUTO-SELECT se c'è categoryParam
                if (categoryParam && data.length > 0) {
                    const matchedCategory = data.find(
                        cat => cat.name.toLowerCase() === categoryParam.toLowerCase() ||
                        cat.name.toLowerCase().includes(categoryParam.toLowerCase())
                    )
                    if (matchedCategory) {
                        setSelectedCategory(matchedCategory)
                    }
                }
            }
            setIsLoading(false)
        }
        if (user) {
            fetchCategories()
        }
    }, [user, categoryParam])

    // Carica gli operatori QUANDO l'utente seleziona una categoria
    useEffect(() => {
        if (!selectedCategory) return // Non fare nulla se non c'è categoria

        const fetchOperators = async () => {
        setIsLoading(true)
        setOperators([]) // Svuota la lista precedente
        setServiceTypes([]) // Svuota la lista successiva
        
        const { data, error } = await supabase
            .from('operators')
            .select('*')
            .eq('category_id', selectedCategory.id) // Filtra per ID categoria!
        
        if (error) {
            setError(error.message)
        } else if (data) {
            setOperators(data)
            setStep(2) // Avanza allo step 2
        }
        setIsLoading(false)
        }
        fetchOperators()
    }, [selectedCategory]) // Si attiva quando selectedCategory cambia

    // Carica i tipi di servizio QUANDO l'utente seleziona un operatore
    useEffect(() => {
        if (!selectedOperator) return

        const fetchServiceTypes = async () => {
        setIsLoading(true)
        setServiceTypes([]) // Svuota

        const { data, error } = await supabase
            .from('service_types')
            .select('*')
            .eq('operator_id', selectedOperator.id) // Filtra per ID operatore!
        
        if (error) {
            setError(error.message)
        } else if (data) {
            setServiceTypes(data)
            setStep(3) // Avanza allo step 3
        }
        setIsLoading(false)
        }
        fetchServiceTypes()
    }, [selectedOperator]) // Si attiva quando selectedOperator cambia


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

    // Mostra un caricamento generale se l'autenticazione sta caricando
    if (isAuthLoading) {
        return <div className="p-8 text-center">Verifica sessione...</div>
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

                {/* Messaggi di errore o caricamento */}
                {isLoading && <p className="text-center">Caricamento...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}

                {/* --- STEP 1: CATEGORIE --- */}
                {step === 1 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">1. Scegli la categoria</h2>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category)}
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
                        <h2 className="text-xl font-semibold">
                            2. Scegli l&apos;operatore (per {selectedCategory?.name})
                        </h2>
                        {operators.map((operator) => (
                            <button
                                key={operator.id}
                                onClick={() => setSelectedOperator(operator)}
                                className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                            >
                                {operator.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* --- STEP 3: TIPO SERVIZIO --- */}
                {step === 3 && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-semibold">
                            3. Scegli il tipo di servizio (per {selectedOperator?.name})
                        </h2>
                        {serviceTypes.map((service) => (
                            <button
                                key={service.id}
                                onClick={() => handleSelectService(service)}
                                className="block w-full rounded-lg border p-4 text-left text-lg hover:bg-gray-50"
                            >
                                {service.name}
                            </button>
                        ))}
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
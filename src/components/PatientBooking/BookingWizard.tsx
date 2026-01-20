import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BrainCircuit, Check } from 'lucide-react';
import RegisterStep from './steps/RegisterStep';
import AnamnesisStep from './steps/AnamnesisStep';
import ScheduleStep from './steps/ScheduleStep';
import PaymentStep from './steps/PaymentStep';
import TherapistSelectionStep from './steps/TherapistSelectionStep';
import { AddToCalendar } from '../AddToCalendar';

const BookingWizard: React.FC = () => {
    const { step, therapistId } = useParams();
    const navigate = useNavigate();

    // Step 1: Therapist Selection (skipped if therapistId in URL)
    // Step 2: Schedule
    // Step 3: Register
    // Step 4: Anamnesis
    // Step 5: Payment
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        complaint: '',
        history: '',
        medication: '',
        date: '',
        time: '',
        therapistId: '',
        price: 0,
        therapistName: ''
    });
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [appointmentId, setAppointmentId] = useState<string | null>(null);
    const [patientId, setPatientId] = useState<string | null>(null);

    // Track if we should skip the first step (Therapist Selection)
    const [skipTherapistSelection, setSkipTherapistSelection] = useState(false);

    // Fetch therapist details when ID changes
    useEffect(() => {
        const fetchTherapistDetails = async () => {
            if (!formData.therapistId) return;

            try {
                const res = await fetch(`/api/public/therapists?id=${formData.therapistId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.therapists && data.therapists.length > 0) {
                        const therapist = data.therapists[0];
                        setFormData(prev => ({
                            ...prev,
                            price: therapist.price || 100, // Default to 100 if not set
                            therapistName: therapist.name
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch therapist details", error);
            }
        };

        fetchTherapistDetails();
    }, [formData.therapistId]);

    useEffect(() => {
        // Load drafted data from localStorage if available
        const savedData = localStorage.getItem('booking_draft');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Only merge if it's a draft
                setFormData(prev => ({ ...prev, ...parsed }));
                if (parsed.appointmentId) {
                    setAppointmentId(parsed.appointmentId);
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }

        // Initialize from URL params
        if (therapistId) {
            setFormData(prev => ({ ...prev, therapistId }));
            setSkipTherapistSelection(true);
            setCurrentStep(2);
        } else if (step) {
            const stepNum = parseInt(step);
            if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 5) {
                setCurrentStep(stepNum);
            }
        }

        // Handle Stripe Redirect Return
        const query = new URLSearchParams(window.location.search);
        const redirectStatus = query.get('redirect_status');
        const paymentIntentId = query.get('payment_intent');

        // Use a flag to prevent double-firing if strict mode is on, though useEffect should be fine
        if (redirectStatus === 'succeeded' && paymentIntentId) {
            // Retrieve appointment ID from local storage (it's the only place we have it if we lost state)
            // But wait, the wizard state might be re-initialized from localStorage 'booking_draft'
            // We need to confirm the appointment.
            const confirmRedirect = async () => {
                let currentAppointmentId = appointmentId;

                // Try to find appointmentId in localStorage if not in state
                if (!currentAppointmentId) {
                    const savedData = localStorage.getItem('booking_draft');
                    if (savedData) {
                        try {
                            const parsed = JSON.parse(savedData);
                            currentAppointmentId = parsed.appointmentId;
                        } catch (e) {
                            console.error("Error parsing saved data to find appointmentId", e);
                        }
                    }
                }

                if (currentAppointmentId) {
                    try {
                        // Call manual-confirm to ensure status is updated in database
                        await fetch('/api/manual-confirm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                paymentIntentId,
                                appointmentId: currentAppointmentId
                            })
                        });
                    } catch (e) {
                        console.error("Manual confirmation failed", e);
                    }
                }

                // Show success view
                setIsCompleted(true);
            };

            confirmRedirect();
        }
    }, [therapistId, step]);

    // Persist form data on change
    useEffect(() => {
        const draft = {
            ...formData,
            appointmentId // persist appointmentId too
        };
        if (formData.name || formData.email || formData.date || appointmentId) {
            localStorage.setItem('booking_draft', JSON.stringify(draft));
        }
    }, [formData, appointmentId]);

    const updateData = (data: any) => {
        setFormData(prev => ({ ...prev, ...data }));
    };

    const nextStep = () => setCurrentStep(prev => prev + 1);
    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleTherapistSelect = (therapistId: string) => {
        setFormData(prev => ({ ...prev, therapistId }));
        nextStep();
    }



    const createPendingBooking = async (): Promise<boolean> => {
        if (appointmentId) return true; // Already created

        try {
            const response = await fetch('/api/booking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, status: 'pending_payment' })
            });
            const data = await response.json();
            if (response.ok) {
                setPatientId(data.patientId);
                setAppointmentId(data.appointmentId);
                return true;
            } else {
                console.error('Failed to create pending booking (server logic)', data);
                return false;
            }
        } catch (e) {
            console.error('Failed to create pending booking (network/client)', e);
            return false;
        }
    };

    const handleCompletion = async () => {
        // Payment is already done via Stripe Component
        // We just need to clear storage and show success
        localStorage.removeItem('booking_draft');
        setIsCompleted(true);
    };

    // Auto-redirect effect
    useEffect(() => {
        if (isCompleted) {
            const timer = setTimeout(() => {
                // Redirect to login page so client can set up credentials
                window.location.href = '/portal-paciente/cadastro';
            }, 6000); // 6 seconds
            return () => clearTimeout(timer);
        }
    }, [isCompleted]);

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl text-center animate-scale-in">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <Check size={40} strokeWidth={3} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Pagamento Confirmado!</h2>
                    <p className="text-slate-600 dark:text-slate-300 mb-6">
                        Sua sessão foi agendada com sucesso. A confirmação será enviada automaticamente para seu WhatsApp.
                    </p>

                    <div className="mb-4 flex flex-col items-center gap-4">
                        <AddToCalendar
                            title="Sessão TRG - TeraNexus"
                            date={formData.date}
                            time={formData.time}
                            description={`Sessão agendada via TeraNexus.\nQueixa: ${formData.complaint}`}
                            className="w-full"
                        />
                    </div>

                    <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-900/30 flex flex-col items-center gap-2">
                        <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                        <p className="text-sm font-bold text-primary-700 dark:text-primary-300">Sincronizando... Redirecionando em breve</p>
                    </div>

                    <a
                        href="/portal-paciente/cadastro"
                        className="block w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary-500/30 mb-3"
                    >
                        Acessar Portal Agora
                    </a>
                </div>
            </div>
        );
    }

    // Determine actual step counts for display (adjust if skipping step 1)
    const stepsToDisplay = skipTherapistSelection ? [2, 3, 4, 5] : [1, 2, 3, 4, 5];

    // Map step view logic
    const handleAnamnesisNext = async () => {
        setIsLoading(true);
        const success = await createPendingBooking();
        setIsLoading(false);
        if (success) {
            nextStep();
        } else {
            alert('Erro ao criar agendamento. Por favor, tente novamente.');
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <TherapistSelectionStep onSelect={handleTherapistSelect} />;
            case 2:
                return <ScheduleStep data={formData} onUpdate={updateData} onNext={nextStep} onBack={skipTherapistSelection ? () => { } : prevStep} />;
            case 3:
                return <RegisterStep data={formData} onUpdate={updateData} onNext={nextStep} />;
            case 4:
                return <AnamnesisStep data={formData} onUpdate={updateData} onNext={handleAnamnesisNext} onBack={prevStep} />;
            case 5:
                return <PaymentStep data={formData} appointmentId={appointmentId} onBack={prevStep} onComplete={handleCompletion} />;
            default:
                return <div>Erro: Passo desconhecido</div>;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
            {/* Header */}
            <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-6 lg:px-12 sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shadow-lg shadow-primary-500/20">
                        <img src="/logo-new.jpg" alt="TeraNexus" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
                        Tera<span className="text-primary-500">Nexus</span>
                    </span>
                </div>

                {/* Progress Steps */}
                <div className="hidden md:flex items-center gap-4">
                    {stepsToDisplay.map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${step === currentStep
                                    ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/30'
                                    : step < currentStep
                                        ? 'bg-green-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                                }
              `}>
                                {step < currentStep ? <Check size={16} /> : (skipTherapistSelection ? index + 1 : step)}
                            </div>
                            {index < stepsToDisplay.length - 1 && <div className={`w-12 h-1 rounded-full ${step < currentStep ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>}
                        </div>
                    ))}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="w-full max-w-5xl">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-500 font-medium">Processando agendamento...</p>
                        </div>
                    ) : (
                        renderStep()
                    )}
                </div>
            </main>
        </div>
    );
};


export default BookingWizard;

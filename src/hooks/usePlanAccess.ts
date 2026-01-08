import { AppView, TherapistPlan } from '../enums';
import { PLAN_FEATURES } from '../config/planConfig';

interface PlanAccessHook {
    plan: TherapistPlan;
    planLabel: string;
    hasAccess: (view: AppView) => boolean;
    getAvailableViews: () => AppView[];
    isRestricted: (view: AppView) => boolean;
    getRestrictedViews: () => AppView[];
}

const PLAN_LABELS: Record<TherapistPlan, string> = {
    [TherapistPlan.TRIAL]: 'Trial (7 dias)',
    [TherapistPlan.INICIANTE]: 'Iniciante',
    [TherapistPlan.PROFISSIONAL]: 'Profissional',
    [TherapistPlan.CLINICA]: 'Clínica',
};

/**
 * Hook for checking feature access based on therapist subscription plan.
 * Reads plan from localStorage (set during login/registration).
 */
export const usePlanAccess = (): PlanAccessHook => {
    // Get therapist data from localStorage
    const therapistData = localStorage.getItem('therapist');
    const therapist = therapistData ? JSON.parse(therapistData) : null;

    // Normalize plan value (handle legacy values and undefined)
    const rawPlan = therapist?.plan || 'trial';
    const plan = normalizePlan(rawPlan);

    const allowedViews = PLAN_FEATURES[plan] || PLAN_FEATURES[TherapistPlan.TRIAL];

    const hasAccess = (view: AppView): boolean => {
        return allowedViews.includes(view);
    };

    const getAvailableViews = (): AppView[] => {
        return allowedViews;
    };

    const isRestricted = (view: AppView): boolean => {
        return !hasAccess(view);
    };

    const getRestrictedViews = (): AppView[] => {
        const allViews = Object.values(AppView);
        return allViews.filter(view => !allowedViews.includes(view));
    };

    return {
        plan,
        planLabel: PLAN_LABELS[plan],
        hasAccess,
        getAvailableViews,
        isRestricted,
        getRestrictedViews,
    };
};

/**
 * Normalize plan values from database/legacy to current enum values.
 */
function normalizePlan(rawPlan: string): TherapistPlan {
    const planMap: Record<string, TherapistPlan> = {
        // Current values
        'trial': TherapistPlan.TRIAL,
        'iniciante': TherapistPlan.INICIANTE,
        'profissional': TherapistPlan.PROFISSIONAL,
        'clinica': TherapistPlan.CLINICA,
        // Legacy values
        'free': TherapistPlan.INICIANTE,
        'pro': TherapistPlan.PROFISSIONAL,
        'enterprise': TherapistPlan.CLINICA,
        // Stripe Price IDs (fallback mapping)
        'price_1ScuH5KPo7EypB7VQ7epTjiW': TherapistPlan.TRIAL, // Estágio
        'price_1ScuH5KPo7EypB7VnIs6qfbQ': TherapistPlan.INICIANTE, // Iniciante R$47
        'price_1Sd8DXKPo7EypB7VZwytTUEP': TherapistPlan.PROFISSIONAL, // Profissional R$97
    };

    return planMap[rawPlan.toLowerCase()] || TherapistPlan.TRIAL;
}

export default usePlanAccess;

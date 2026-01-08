import { TherapistPlan, AppView } from '../enums';

// Feature access per plan
export const PLAN_FEATURES: Record<TherapistPlan, AppView[]> = {
    [TherapistPlan.TRIAL]: [
        AppView.DASHBOARD,
        AppView.AGENDA,
        AppView.PATIENTS,
        AppView.THERAPY,
        AppView.FINANCIAL,
        AppView.MARKETING,
        AppView.REPORTS,
        AppView.SETTINGS,
    ],
    [TherapistPlan.INICIANTE]: [
        AppView.DASHBOARD,
        AppView.AGENDA,
        AppView.PATIENTS,
        AppView.THERAPY,
        AppView.SETTINGS,
    ],
    [TherapistPlan.PROFISSIONAL]: [
        AppView.DASHBOARD,
        AppView.AGENDA,
        AppView.PATIENTS,
        AppView.THERAPY,
        AppView.FINANCIAL,
        AppView.MARKETING,
        AppView.REPORTS,
        AppView.SETTINGS,
    ],
    [TherapistPlan.CLINICA]: [
        AppView.DASHBOARD,
        AppView.AGENDA,
        AppView.PATIENTS,
        AppView.THERAPY,
        AppView.FINANCIAL,
        AppView.MARKETING,
        AppView.REPORTS,
        AppView.SETTINGS,
    ],
};

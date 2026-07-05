import { create } from 'zustand';

export interface Application {
  id: string;
  jobTitle: string;
  companyName: string;
  jobUrl: string;
  status: 'DISCOVERED' | 'TAILORING' | 'HITL_REVIEW' | 'APPLIED' | 'INTERVIEWING' | 'OFFER' | 'DECLINED' | 'ARCHIVED';
  matchScore: number | null;
  salaryRange?: string;
  created_at: string;
}

interface ApplicationStore {
  applications: Application[];
  activeApplicationId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setApplications: (apps: Application[]) => void;
  addApplication: (app: Application) => void;
  updateApplicationStatus: (id: string, newStatus: Application['status']) => void;
  setActiveApplication: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (err: string | null) => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  applications: [],
  activeApplicationId: null,
  isLoading: false,
  error: null,
  
  setApplications: (apps) => set({ applications: apps }),
  addApplication: (app) => set((state) => ({ 
    applications: [app, ...state.applications] 
  })),
  updateApplicationStatus: (id, newStatus) => set((state) => ({
    applications: state.applications.map((app) => 
      app.id === id ? { ...app, status: newStatus } : app
    )
  })),
  setActiveApplication: (id) => set({ activeApplicationId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (err) => set({ error: err })
}));

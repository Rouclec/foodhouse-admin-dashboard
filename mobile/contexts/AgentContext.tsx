import { demoConfig } from '@/constants/demo';

type AgentKYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
type AgentStatus = 'not_registered' | 'registered' | 'online' | 'offline';

interface AgentProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

interface AgentState {
  isLoggedIn: boolean;
  isDemoMode: boolean;
  agent: AgentProfile | null;
  kycStatus: AgentKYCStatus;
  agentStatus: AgentStatus;
  earnings: number;
  completedDeliveries: number;
  pendingDeliveries: number;
}

const initialAgentState: AgentState = {
  isLoggedIn: false,
  isDemoMode: false,
  agent: null,
  kycStatus: 'not_started',
  agentStatus: 'not_registered',
  earnings: 0,
  completedDeliveries: 0,
  pendingDeliveries: 0,
};

class AgentDemoState {
  private state: AgentState = { ...initialAgentState };
  private listeners: Set<(state: AgentState) => void> = new Set();

  getState(): AgentState {
    return { ...this.state };
  }

  isDemoModeEnabled(): boolean {
    return demoConfig.enabled && this.state.isDemoMode;
  }

  loginAsAgent(demoMode: boolean = false) {
    const demoAgent: AgentProfile = {
      id: demoConfig.demoUserId,
      email: 'agent@foodhouse.demo',
      phone: '+237 600 000 000',
      firstName: 'Demo',
      lastName: 'Agent',
    };

    this.state = {
      ...this.state,
      isLoggedIn: true,
      isDemoMode: demoMode,
      agent: demoAgent,
      kycStatus: demoMode ? 'verified' : 'not_started',
      agentStatus: demoMode ? 'offline' : 'not_registered',
    };
    this.notifyListeners();
  }

  logout() {
    this.state = { ...initialAgentState };
    this.notifyListeners();
  }

  submitKYC() {
    if (this.state.isDemoMode) {
      this.state = {
        ...this.state,
        kycStatus: 'pending',
      };
      this.notifyListeners();
      
      setTimeout(() => {
        this.approveKYC();
      }, demoConfig.kycAutoApproveDelay);
    }
  }

  approveKYC() {
    this.state = {
      ...this.state,
      kycStatus: 'verified',
      agentStatus: 'offline',
    };
    this.notifyListeners();
  }

  rejectKYC(_reason: string) {
    this.state = {
      ...this.state,
      kycStatus: 'rejected',
    };
    this.notifyListeners();
  }

  goOnline() {
    this.state = {
      ...this.state,
      agentStatus: 'online',
    };
    this.notifyListeners();
  }

  goOffline() {
    this.state = {
      ...this.state,
      agentStatus: 'offline',
    };
    this.notifyListeners();
  }

  updateEarnings(amount: number) {
    this.state = {
      ...this.state,
      earnings: this.state.earnings + amount,
    };
    this.notifyListeners();
  }

  completeDelivery() {
    this.state = {
      ...this.state,
      completedDeliveries: this.state.completedDeliveries + 1,
      pendingDeliveries: Math.max(0, this.state.pendingDeliveries - 1),
    };
    this.notifyListeners();
  }

  resetDemo() {
    this.state = {
      ...this.state,
      kycStatus: 'verified',
      agentStatus: 'offline',
      earnings: 15000,
      completedDeliveries: 5,
      pendingDeliveries: 2,
    };
    this.notifyListeners();
  }

  setAgent(agentData: Partial<AgentProfile>) {
    this.state = {
      ...this.state,
      agent: this.state.agent ? { ...this.state.agent, ...agentData } : agentData as AgentProfile,
    };
    this.notifyListeners();
  }

  subscribe(listener: (state: AgentState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }
}

export const agentDemoState = new AgentDemoState();
export type { AgentState, AgentKYCStatus, AgentStatus, AgentProfile };

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type AgentKYCStatus = 'not_started' | 'pending' | 'verified' | 'rejected';
export type AgentStatus = 'not_registered' | 'registered' | 'online' | 'offline';

export interface AgentProfile {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

export interface AgentState {
  isLoggedIn: boolean;
  isDemoMode: boolean;
  agent: AgentProfile | null;
  kycStatus: AgentKYCStatus;
  agentStatus: AgentStatus;
  earnings: number;
  completedDeliveries: number;
  pendingDeliveries: number;
}

const initialState: AgentState = {
  isLoggedIn: false,
  isDemoMode: false,
  agent: null,
  kycStatus: 'not_started',
  agentStatus: 'not_registered',
  earnings: 0,
  completedDeliveries: 0,
  pendingDeliveries: 0,
};

interface AgentContextType {
  state: AgentState;
  loginAsAgent: (demoMode?: boolean) => void;
  logout: () => void;
  submitKYC: () => void;
  approveKYC: () => void;
  rejectKYC: (reason: string) => void;
  goOnline: () => void;
  goOffline: () => void;
  updateEarnings: (amount: number) => void;
  completeDelivery: () => void;
  resetDemo: () => void;
  setAgent: (agent: Partial<AgentProfile>) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AgentState>(initialState);

  const loginAsAgent = useCallback((demoMode: boolean = false) => {
    const demoAgent: AgentProfile = {
      id: 'demo-agent-001',
      email: 'agent@foodhouse.demo',
      phone: '+237 600 000 000',
      firstName: 'Demo',
      lastName: 'Agent',
      profileImage: undefined,
    };
    
    setState(prev => ({
      ...prev,
      isLoggedIn: true,
      isDemoMode: demoMode,
      agent: demoAgent,
      kycStatus: demoMode ? 'verified' : 'not_started',
      agentStatus: demoMode ? 'offline' : 'not_registered',
    }));
  }, []);

  const logout = useCallback(() => {
    setState(initialState);
  }, []);

  const submitKYC = useCallback(() => {
    setState(prev => ({
      ...prev,
      kycStatus: 'pending',
    }));
  }, []);

  const approveKYC = useCallback(() => {
    setState(prev => ({
      ...prev,
      kycStatus: 'verified',
      agentStatus: 'offline',
    }));
  }, []);

  const rejectKYC = useCallback((reason: string) => {
    setState(prev => ({
      ...prev,
      kycStatus: 'rejected',
    }));
  }, []);

  const goOnline = useCallback(() => {
    setState(prev => ({
      ...prev,
      agentStatus: 'online',
    }));
  }, []);

  const goOffline = useCallback(() => {
    setState(prev => ({
      ...prev,
      agentStatus: 'offline',
    }));
  }, []);

  const updateEarnings = useCallback((amount: number) => {
    setState(prev => ({
      ...prev,
      earnings: prev.earnings + amount,
    }));
  }, []);

  const completeDelivery = useCallback(() => {
    setState(prev => ({
      ...prev,
      completedDeliveries: prev.completedDeliveries + 1,
      pendingDeliveries: Math.max(0, prev.pendingDeliveries - 1),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    setState(prev => ({
      ...prev,
      kycStatus: 'verified',
      agentStatus: 'offline',
      earnings: 15000,
      completedDeliveries: 5,
      pendingDeliveries: 2,
    }));
  }, []);

  const setAgent = useCallback((agentData: Partial<AgentProfile>) => {
    setState(prev => ({
      ...prev,
      agent: prev.agent ? { ...prev.agent, ...agentData } : agentData as AgentProfile,
    }));
  }, []);

  return (
    <AgentContext.Provider
      value={{
        state,
        loginAsAgent,
        logout,
        submitKYC,
        approveKYC,
        rejectKYC,
        goOnline,
        goOffline,
        updateEarnings,
        completeDelivery,
        resetDemo,
        setAgent,
      }}>
      {children}
    </AgentContext.Provider>
  );
};

export const useAgent = (): AgentContextType => {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

export default AgentContext;

// Demo mode should be explicitly enabled via env so it can't
// accidentally ship turned on in production builds.
export const canEnableDemoMode = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true';

export const demoConfig = {
  enabled: canEnableDemoMode,
  kycAutoApproveDelay: 3000,
  demoUserId: 'demo-agent-001',
};

// components/PremiumFeature.tsx
import { usePermitly, Protect } from '@permitly/react'; // Internal Package

/* 
 * Ensure your PermitlyProvider is configured with the API URL:
 * <PermitlyProvider project="pk_live_6932434400033d7e6977" api="http://localhost:3000">
 */

export function PremiumFeature() {
  const { isAllowed, isLoading, paywallConfig } = usePermitly();

  if (isLoading) return <div>Checking License...</div>;

  // Option 1: Direct Check
  if (!isAllowed) {
    // You can use paywallConfig.theme / title / message here
    return <div>🔒 Upgrade to access this feature</div>;
  }

  return (
      <div>✨ Premium Magic Content ✨</div>
  );
}

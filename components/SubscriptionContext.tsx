import React, { createContext, useContext, useState, ReactNode } from 'react';

type Plan = 'free' | 'standard' | 'pro';

interface SubscriptionState {
  currentPlan: Plan;
  creditsRemaining: number;
  isSubscribed: boolean;
  purchasedCredits: number;
  subscribeToPlan: (plan: Plan, credits?: number) => void;
  purchaseCredits: (amount: number) => void;
  resetToFree: () => void;
}

const DEFAULT: SubscriptionState = {
  currentPlan: 'free',
  creditsRemaining: 10,
  isSubscribed: false,
  purchasedCredits: 0,
  subscribeToPlan: () => {},
  purchaseCredits: () => {},
  resetToFree: () => {}
};

const SubscriptionContext = createContext<SubscriptionState>(DEFAULT);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState<Plan>('free');
  const [creditsRemaining, setCreditsRemaining] = useState<number>(10);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [purchasedCredits, setPurchasedCredits] = useState<number>(0);

  const subscribeToPlan = (plan: Plan, credits?: number) => {
    setCurrentPlan(plan);
    setIsSubscribed(plan !== 'free');
    if (typeof credits === 'number') {
      setCreditsRemaining(prev => Math.max(prev, credits));
    } else {
      // default credits per plan
      if (plan === 'free') setCreditsRemaining(10);
      if (plan === 'standard') setCreditsRemaining(prev => Math.max(prev, 200));
      if (plan === 'pro') setCreditsRemaining(prev => Math.max(prev, 1000));
    }
  };

  const purchaseCredits = (amount: number) => {
    setCreditsRemaining(prev => prev + amount);
    setPurchasedCredits(prev => prev + amount);
  };

  const resetToFree = () => {
    setCurrentPlan('free');
    setIsSubscribed(false);
    setCreditsRemaining(10);
    setPurchasedCredits(0);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        currentPlan,
        creditsRemaining,
        isSubscribed,
        purchasedCredits,
        subscribeToPlan,
        purchaseCredits,
        resetToFree
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => useContext(SubscriptionContext);
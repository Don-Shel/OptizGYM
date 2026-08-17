export const paystackConfig = {
  publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY?.trim() || '',
  currency: 'KES',
};

export interface PaystackOptions {
  email: string;
  amount: number;
  currency?: string;
  ref?: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export const initializePaystackPayment = (options: PaystackOptions) => {
  const ref = options.ref || `txn-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const paystack = typeof window !== 'undefined' ? (window as any).PaystackPop : undefined;

  if (!paystackConfig.publicKey || !paystack) {
    throw new Error('Paystack checkout is not configured. Please contact the gym administrator.');
  }

  if (!options.email || !Number.isFinite(options.amount) || options.amount <= 0) {
    throw new Error('A valid customer email and payment amount are required.');
  }

  const handler = paystack.setup({
    key: paystackConfig.publicKey,
    email: options.email,
    amount: Math.round(options.amount * 100),
    currency: options.currency || paystackConfig.currency,
    ref,
    metadata: options.metadata,
    channels: ['card', 'mobile_money', 'bank_transfer', 'bank', 'ussd', 'qr'],
    callback: (response: any) => options.onSuccess(response.reference),
    onClose: options.onClose,
  });
  handler.openIframe();
  return ref;
};

const PRODUCTION_PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 1500, yearly: 15000 },
  pro: { monthly: 3500, yearly: 35000 },
  elite: { monthly: 7500, yearly: 75000 },
} as const;

// Test mode intentionally mirrors the original membership amounts so checkout
// and server-side verification remain consistent. Enable with
// VITE_PAYMENT_TEST_MODE=true in the frontend test deployment.
const TEST_PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 1500, yearly: 15000 },
  pro: { monthly: 3500, yearly: 35000 },
  elite: { monthly: 7500, yearly: 75000 },
} as const;

const useTestPricing = import.meta.env.VITE_PAYMENT_TEST_MODE === 'true' || import.meta.env.MODE === 'test';
export const PLAN_PRICES = useTestPricing ? TEST_PLAN_PRICES : PRODUCTION_PLAN_PRICES;
export const PAYMENT_PRICING_MODE = useTestPricing ? 'test' : 'production';

export const PLAN_FEATURES = {
  free: ['Limited class viewing', 'No bookings', 'Basic profile'],
  basic: ['Access to gym floor', '2 group classes / week', 'Locker room access'],
  pro: ['Unlimited group classes', 'Personal training intro', 'Nutrition guide', 'Priority booking'],
  elite: ['24/7 access', 'All-inclusive classes', 'Personal trainer (4 sessions)', 'Recovery zone', 'Guest passes'],
};

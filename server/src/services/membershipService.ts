export const calculateExpiryDate = (baseDate: Date, billing: 'monthly' | 'yearly'): Date => {
  const expiresAt = new Date(baseDate);
  if (billing === 'yearly') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }
  return expiresAt;
};

export const getBaseDateForMembership = (currentExpiry: string | null | Date, type: string, status: string): Date => {
  let baseDate = new Date();
  if (type === 'renewal' && status === 'active' && currentExpiry) {
    const expiry = new Date(currentExpiry);
    if (expiry > baseDate) {
      baseDate = expiry;
    }
  }
  return baseDate;
};

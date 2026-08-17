export function getNotificationDestination(notification: { title?: string; message?: string; type?: string }) {
  const text = `${notification.title || ''} ${notification.message || ''} ${notification.type || ''}`.toLowerCase();

  if (/payment|paystack|invoice|dues|billing|receipt/.test(text)) return '/dashboard/payments';
  if (/membership|subscription|plan|renewal|freeze/.test(text)) return '/dashboard/membership';
  if (/booking|class|session|trainer/.test(text)) return '/dashboard/classes';
  if (/workout|activity|progress|goal|calorie/.test(text)) return '/dashboard/progress';
  return '/dashboard';
}

// Utility to redirect users to external payment application

export interface PaymentRedirectParams {
  userId: string
  boosterId: string
  amount: number
  boosterName: string
}

export function redirectToPaymentApp(params: PaymentRedirectParams) {
  const paymentAppUrl = process.env.NEXT_PUBLIC_PAYMENT_APP_URL || 'https://your-payment-app.com'
  const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard`)
  
  const checkoutUrl = new URL('/checkout', paymentAppUrl)
  checkoutUrl.searchParams.set('userId', params.userId)
  checkoutUrl.searchParams.set('boosterId', params.boosterId)
  checkoutUrl.searchParams.set('amount', params.amount.toString())
  checkoutUrl.searchParams.set('boosterName', params.boosterName)
  checkoutUrl.searchParams.set('returnUrl', returnUrl)
  
  window.location.href = checkoutUrl.toString()
}

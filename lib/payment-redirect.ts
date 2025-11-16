// Utility to redirect users to external payment application

export interface PaymentRedirectParams {
  userId: string
  boosterId: string
  amount: number
  boosterName: string
  isPresale?: boolean
  tokensAmount?: number
}

export function redirectToPaymentApp(params: PaymentRedirectParams) {
  const paymentAppUrl = process.env.NEXT_PUBLIC_PAYMENT_APP_URL || 'https://your-payment-app.com'
  const returnUrl = encodeURIComponent(
    params.isPresale 
      ? `${window.location.origin}/ghjkloiuyt` 
      : `${window.location.origin}/dashboard`
  )
  
  const checkoutUrl = new URL('/checkout', paymentAppUrl)
  checkoutUrl.searchParams.set('userId', params.userId)
  checkoutUrl.searchParams.set('amount', params.amount.toString())
  checkoutUrl.searchParams.set('returnUrl', returnUrl)
  
  if (params.isPresale) {
    checkoutUrl.searchParams.set('type', 'presale')
    checkoutUrl.searchParams.set('tokensAmount', params.tokensAmount?.toString() || '0')
    checkoutUrl.searchParams.set('itemName', params.boosterName)
  } else {
    checkoutUrl.searchParams.set('boosterId', params.boosterId)
    checkoutUrl.searchParams.set('boosterName', params.boosterName)
    checkoutUrl.searchParams.set('type', 'booster')
  }
  
  window.location.href = checkoutUrl.toString()
}

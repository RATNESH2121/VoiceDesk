// src/lib/validateTwilio.ts
// Validates that incoming requests are genuinely from Twilio
// https://www.twilio.com/docs/usage/security

import twilio from 'twilio'

export function validateTwilioSignature(
  req: Request, 
  formData: FormData, 
  path: string
): boolean {
    // Skip validation in development (ngrok changes URL constantly)
    if (process.env.NODE_ENV === 'development') {
        return true
    }

    const twilioSignature = req.headers.get('x-twilio-signature')
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    
    // Construct the full URL that Twilio called
    // We use headers to get the actual host to avoid NEXT_PUBLIC_APP_URL mismatches
    const protocol = req.headers.get('x-forwarded-proto') || 'https'
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const url = `${protocol}://${host}${path}`

    console.log('[validateTwilio] Validating for URL:', url)

    if (!twilioSignature) {
        console.error('[validateTwilio] Missing x-twilio-signature header')
        return false
    }

    // Convert FormData to a plain object for Twilio validation
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            params[key] = value
        }
    })

    const isValid = twilio.validateRequest(authToken, twilioSignature, url, params)
    
    if (!isValid) {
        console.error('[validateTwilio] Invalid signature for URL:', url)
    }

    return isValid
}
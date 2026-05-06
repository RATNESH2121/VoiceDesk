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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')
    const url = `${baseUrl}${path}`

    if (!twilioSignature) return false

    // Convert FormData to a plain object for Twilio validation
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            params[key] = value
        }
    })

    return twilio.validateRequest(authToken, twilioSignature, url, params)
}
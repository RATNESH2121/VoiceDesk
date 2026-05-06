// src/app/api/voice/incoming/route.ts
// Twilio calls this endpoint every time someone calls your clinic number
// Returns TwiML telling Twilio what to do with the call

import { NextRequest } from 'next/server'
import {
    twimlResponse,
    twimlSay,
    twimlSayAndRecord,
    twimlHangup,
} from '@/lib/twiml'
import { getClinicByPhone, isWithinWorkingHours } from '@/lib/getClinic'
import { createCallLog } from '@/lib/logCall'
import { validateTwilioSignature } from '@/lib/validateTwilio'

export async function POST(req: NextRequest) {
    // Parse Twilio's form-encoded POST body
    const formData = await req.formData()

    // Validate request is from Twilio
    if (!validateTwilioSignature(req, formData, '/api/voice/incoming')) {
        return new Response('Invalid signature', { status: 401 })
    }

    const twilioCallSid = formData.get('CallSid') as string
    const callerPhone = formData.get('From') as string
    const calledNumber = formData.get('To') as string   // your Twilio number

    console.log('[incoming] call from:', callerPhone, 'to:', calledNumber, 'sid:', twilioCallSid)

    // 1. Identify which clinic this number belongs to
    const clinic = await getClinicByPhone(calledNumber)

    if (!clinic) {
        // Unknown number — just hang up gracefully
        console.error('[incoming] no clinic found for number:', calledNumber)
        return twimlResponse(
            twimlSay('Is number par koi clinic registered nahi hai.') +
            twimlHangup()
        )
    }

    // 2. Log the inbound call immediately (we update it later with transcript/outcome)
    await createCallLog({
        clinic_id: clinic.id,
        twilio_call_sid: twilioCallSid,
        caller_phone: callerPhone,
        outcome: 'failed', // will be updated to real outcome later
    })

    // 3. Check if clinic is within working hours
    const isOpen = isWithinWorkingHours(clinic)

    if (!isOpen) {
        // After hours: capture callback request instead
        return twimlResponse(
            twimlSay(
                `${clinic.name} abhi band hai. ` +
                `Apna naam aur message record karein, hum aapko jald call back karenge.`
            ) +
            twimlSayAndRecord(
                'Beep ke baad boliye.',
                '/api/voice/recording-done'
            )
        )
    }

    // 4. Clinic is open — greet and record caller's request
    return twimlResponse(
        twimlSayAndRecord(
            clinic.brand_greeting +
            ' Aap appointment lena chahte hain, ya koi aur jaankari chahiye? Boliye.',
            '/api/voice/recording-done'
        )
    )
}

// Twilio sends a POST — Next.js App Router needs this export
// to prevent "Method Not Allowed" errors
export async function GET() {
    return new Response('Voice webhook — POST only', { status: 405 })
}
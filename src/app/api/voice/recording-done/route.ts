// src/app/api/voice/recording-done/route.ts
// Called by Twilio when caller finishes speaking
// Optimized for Vercel Serverless (Stateless & Robust)

import { NextRequest } from 'next/server'
import {
    twimlResponse,
    twimlSay,
    twimlHangup,
} from '@/lib/twiml'
import { transcribeAudio } from '@/lib/transcribe'
import { updateCallLog } from '@/lib/logCall'
import { getClinicByPhone } from '@/lib/getClinic'
import { validateTwilioSignature } from '@/lib/validateTwilio'

export async function POST(req: NextRequest) {
    console.log('[recording-done] Webhook triggered')

    try {
        const formData = await req.formData()

        // 1. Validate request is from Twilio
        if (!validateTwilioSignature(req, formData, '/api/voice/recording-done')) {
            console.error('[recording-done] Invalid Twilio signature')
            return new Response('Invalid signature', { status: 401 })
        }

        const twilioCallSid = formData.get('CallSid') as string
        const calledNumber = formData.get('To') as string
        const recordingUrl = formData.get('RecordingUrl') as string
        const recordingDuration = parseInt(formData.get('RecordingDuration') as string || '0')

        console.log(`[recording-done] CallSid: ${twilioCallSid}, Duration: ${recordingDuration}`)

        // 2. Guard: if recording is too short, caller likely hung up immediately
        if (recordingDuration < 1) {
            console.log('[recording-done] Recording too short, finishing call')
            await updateCallLog(twilioCallSid, { outcome: 'failed', needs_callback: true })
            return twimlResponse(
                twimlSay('Koi awaaz nahi aayi. Hum aapko baad mein call back karenge.') +
                twimlHangup()
            )
        }

        // 3. Get clinic info
        const clinic = await getClinicByPhone(calledNumber)
        if (!clinic) {
            throw new Error(`Clinic not found for number: ${calledNumber}`)
        }

        // 4. Transcription Process (Wrapped in internal try-catch to fallback gracefully)
        let transcript = '[No transcript generated]'
        try {
            const result = await transcribeAudio(
                recordingUrl,
                process.env.TWILIO_ACCOUNT_SID!,
                process.env.TWILIO_AUTH_TOKEN!
            )
            transcript = result.transcript
        } catch (sttError) {
            console.error('[recording-done] Transcription failed:', sttError)
            // We continue anyway to ensure we log the recording_url at least
        }

        // 5. Update Database
        console.log('[recording-done] Updating Supabase call log...')
        await updateCallLog(twilioCallSid, {
            recording_url: recordingUrl,
            duration_secs: recordingDuration,
            transcript: transcript,
            needs_callback: true,
            outcome: 'callback',
        })

        // 6. Return Final Response (Single-turn for stability)
        console.log('[recording-done] Call successfully processed')
        return twimlResponse(
            twimlSay('Aapka message note ho gaya hai. Hamari team aapko jald hi call back karegi. Dhanyavaad.') +
            twimlHangup()
        )

    } catch (globalError: any) {
        console.error('[recording-done] CRITICAL ROUTE ERROR:', globalError?.message || globalError)
        
        // ALWAYS return valid TwiML so the caller doesn't hear "An application error has occurred"
        return twimlResponse(
            twimlSay('Maafi chahta hoon, kuch technical problem hai. Hum aapko jald hi call back karenge.') +
            twimlHangup()
        )
    }
}

export async function GET() {
    return new Response('POST only', { status: 405 })
}
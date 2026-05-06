// src/app/api/voice/recording-done/route.ts
// Twilio calls this when the caller finishes speaking and recording is ready
// Day 5: add Whisper STT here
// Day 8: add intent classification here

import { NextRequest } from 'next/server'
import { twimlResponse, twimlSay, twimlHangup } from '@/lib/twiml'
import { updateCallLog } from '@/lib/logCall'
import { validateTwilioSignature } from '@/lib/validateTwilio'

export async function POST(req: NextRequest) {
    const formData = await req.formData()

    // Validate request is from Twilio
    if (!validateTwilioSignature(req, formData, '/api/voice/recording-done')) {
        return new Response('Invalid signature', { status: 401 })
    }

    const twilioCallSid = formData.get('CallSid') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const recordingDuration = formData.get('RecordingDuration') as string

    console.log('[recording-done] sid:', twilioCallSid)
    console.log('[recording-done] url:', recordingUrl)
    console.log('[recording-done] duration:', recordingDuration, 'seconds')

    // Save the recording URL to the call log
    // Full processing (STT → classify → respond) added from Day 8
    await updateCallLog(twilioCallSid, {
        recording_url: recordingUrl,
        duration_secs: parseInt(recordingDuration || '0'),
        outcome: 'callback', // temporary until real intent processing is live
        needs_callback: true,
    })

    // Temporary response — replaced with AI-generated TTS on Day 13
    return twimlResponse(
        twimlSay(
            'Dhanyavaad. Aapka message record ho gaya. ' +
            'Hamari team aapko jald call back karegi.'
        ) +
        twimlHangup()
    )
}

export async function GET() {
    return new Response('Recording webhook — POST only', { status: 405 })
}
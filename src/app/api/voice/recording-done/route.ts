// src/app/api/voice/recording-done/route.ts
// Called by Twilio when caller finishes speaking
// Flow: download audio → Whisper STT → save transcript → decide next TwiML

import { NextRequest } from 'next/server'
import {
    twimlResponse,
    twimlSay,
    twimlSayAndRecord,
    twimlHangup,
} from '@/lib/twiml'
import { transcribeAudio, estimateWhisperCost } from '@/lib/transcribe'
import { updateCallLog } from '@/lib/logCall'
import {
    getCallState,
    updateCallState,
    deleteCallState,
} from '@/lib/callState'
import { getClinicByPhone } from '@/lib/getClinic'
import { validateTwilioSignature } from '@/lib/validateTwilio'

const MAX_TURNS = 3 // max times we ask caller to repeat before giving up

export async function POST(req: NextRequest) {
    const formData = await req.formData()

    // Validate request is from Twilio
    if (!validateTwilioSignature(req, formData, '/api/voice/recording-done')) {
        return new Response('Invalid signature', { status: 401 })
    }

    const twilioCallSid = formData.get('CallSid') as string
    const callerPhone = formData.get('From') as string
    const calledNumber = formData.get('To') as string
    const recordingUrl = formData.get('RecordingUrl') as string
    const recordingDuration = parseInt(formData.get('RecordingDuration') as string || '0')

    console.log('[recording-done] sid:', twilioCallSid, 'duration:', recordingDuration)

    // Guard: if recording is too short (< 1 second), caller hung up or silence
    if (recordingDuration < 1) {
        await updateCallLog(twilioCallSid, {
            outcome: 'failed',
            needs_callback: true,
        })
        deleteCallState(twilioCallSid)
        return twimlResponse(
            twimlSay('Koi awaaz nahi aayi. Hum aapko baad mein call back karenge.') +
            twimlHangup()
        )
    }

    // Get conversation state for this call
    const state = getCallState(twilioCallSid)

    // Get clinic info for this number
    const clinic = await getClinicByPhone(calledNumber)

    if (!clinic || !state) {
        console.error('[recording-done] missing clinic or state for sid:', twilioCallSid)
        return twimlResponse(
            twimlSay('Kuch technical problem hai. Baad mein try karein.') +
            twimlHangup()
        )
    }

    // ── STEP 1: Transcribe audio ──────────────────────────────────

    let transcript = ''
    let whisperDuration = recordingDuration

    try {
        const result = await transcribeAudio(
            recordingUrl,
            process.env.TWILIO_ACCOUNT_SID!,
            process.env.TWILIO_AUTH_TOKEN!
        )

        transcript = result.transcript
        whisperDuration = result.duration_secs

        console.log('[recording-done] transcript:', transcript)
        console.log('[recording-done] whisper cost: $', estimateWhisperCost(whisperDuration))

    } catch (err) {
        console.error('[recording-done] transcription failed:', err)

        // If STT fails, ask caller to try again (max retries)
        const newTurn = state.turn + 1
        updateCallState(twilioCallSid, { turn: newTurn })

        if (newTurn >= MAX_TURNS) {
            await updateCallLog(twilioCallSid, { outcome: 'failed', needs_callback: true })
            deleteCallState(twilioCallSid)
            return twimlResponse(
                twimlSay('Maafi chahta hoon, samajh nahi aaya. Hum aapko call back karenge.') +
                twimlHangup()
            )
        }

        return twimlResponse(
            twimlSayAndRecord(
                'Maafi chahta hoon, sunai nahi diya. Kripya dobara boliye.',
                '/api/voice/recording-done'
            )
        )
    }

    // ── STEP 2: Add transcript to call history ───────────────────

    const updatedHistory = [...state.transcript_history, transcript]
    const fullTranscript = updatedHistory.join(' | ')

    updateCallState(twilioCallSid, {
        turn: state.turn + 1,
        transcript_history: updatedHistory,
    })

    // Save transcript to DB
    await updateCallLog(twilioCallSid, {
        recording_url: recordingUrl,
        duration_secs: whisperDuration,
        transcript: fullTranscript,
        needs_callback: true,
        outcome: 'callback',
    })

    // ── STEP 3: Basic keyword detection ──────────────────────────
    // Days 8-11 replace this with real AI classification
    const lowerTranscript = transcript.toLowerCase()

    const isBookingIntent =
        lowerTranscript.includes('appointment') ||
        lowerTranscript.includes('booking') ||
        lowerTranscript.includes('milna') ||
        lowerTranscript.includes('doctor') ||
        lowerTranscript.includes('slot')

    const isTimingIntent =
        lowerTranscript.includes('timing') ||
        lowerTranscript.includes('time') ||
        lowerTranscript.includes('kab') ||
        lowerTranscript.includes('khula')

    const isLocationIntent =
        lowerTranscript.includes('address') ||
        lowerTranscript.includes('location') ||
        lowerTranscript.includes('kahan')

    // ── STEP 4: Generate response based on keyword match ─────────

    let spokenResponse: string

    if (isBookingIntent) {
        spokenResponse = 'Appointment ke liye dhanyavaad. Aapka naam kya hai aur kaunsa din chahiye?'
        updateCallState(twilioCallSid, { intent: 'book_appointment' })
        
        return twimlResponse(
            twimlSayAndRecord(spokenResponse, '/api/voice/recording-done')
        )
    }

    if (isTimingIntent) {
        spokenResponse = `${clinic.name} subah 9 baje se raat 8 baje tak khula rehta hai.`
        deleteCallState(twilioCallSid)
        return twimlResponse(twimlSay(spokenResponse) + twimlHangup())
    }

    if (isLocationIntent) {
        spokenResponse = `${clinic.name} ka address hai: ${clinic.address || 'address set nahi hai'}.`
        deleteCallState(twilioCallSid)
        return twimlResponse(twimlSay(spokenResponse) + twimlHangup())
    }

    // Default: request callback
    spokenResponse = 'Aapka message note ho gaya hai. Hum aapko jald hi call back karenge.'
    deleteCallState(twilioCallSid)

    return twimlResponse(twimlSay(spokenResponse) + twimlHangup())
}

export async function GET() {
    return new Response('POST only', { status: 405 })
}
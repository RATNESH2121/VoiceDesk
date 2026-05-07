// src/lib/transcribe.ts
// Downloads audio from Twilio and transcribes with OpenAI Whisper
// Cost: $0.006 per minute of audio (~₹0.50 per 90-second call)

import OpenAI, { toFile } from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
})

interface TranscribeResult {
    transcript: string
    duration_secs: number
    language_detected: string
}

/**
 * Downloads audio from Twilio and sends to OpenAI Whisper
 */
export async function transcribeAudio(
    recordingUrl: string,
    twilioAccountSid: string,
    twilioAuthToken: string
): Promise<TranscribeResult> {
    console.log('[transcribe] Starting transcription for:', recordingUrl)

    try {
        // 1. Download audio from Twilio
        const audioBuffer = await downloadTwilioAudio(
            recordingUrl,
            twilioAccountSid,
            twilioAuthToken
        )

        // 2. Convert buffer to File object for OpenAI
        const audioFile = await toFile(audioBuffer, 'recording.wav', { type: 'audio/wav' })

        // 3. Send to Whisper
        console.log('[transcribe] Sending to OpenAI Whisper...')
        const response = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'hi', // Optimized for Hindi/Hinglish
            prompt: 'Yeh ek clinic ka phone call hai. Caller appointment lena chahta hai, ya fees, timing, ya address pooch raha hai.',
            response_format: 'verbose_json',
        })

        const verboseResponse = response as any
        
        console.log('[transcribe] Successfully transcribed:', verboseResponse.text?.substring(0, 50) + '...')

        return {
            transcript: verboseResponse.text?.trim() || '',
            duration_secs: Math.ceil(verboseResponse.duration || 0),
            language_detected: verboseResponse.language || 'hi',
        }
    } catch (error: any) {
        console.error('[transcribe] Error during transcription process:', error?.message || error)
        throw error
    }
}

/**
 * Fetches the raw audio from Twilio with Basic Auth and retry logic
 */
async function downloadTwilioAudio(
    recordingUrl: string,
    accountSid: string,
    authToken: string,
    retries = 3
): Promise<Buffer> {

    const url = recordingUrl.endsWith('.wav') ? recordingUrl : `${recordingUrl}.wav`
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[transcribe] Download attempt ${attempt}/${retries} for ${url}`)
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Basic ${credentials}` },
                signal: AbortSignal.timeout(10000) // 10s timeout
            })

            if (response.status === 404 && attempt < retries) {
                console.log('[transcribe] Audio not ready yet (404), waiting...')
                await new Promise(resolve => setTimeout(resolve, attempt * 1500))
                continue
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            console.log(`[transcribe] Downloaded ${buffer.length} bytes`)
            return buffer

        } catch (err: any) {
            console.warn(`[transcribe] Download attempt ${attempt} failed:`, err?.message || err)
            if (attempt === retries) throw err
            await new Promise(resolve => setTimeout(resolve, attempt * 1500))
        }
    }

    throw new Error('Failed to download audio after all retries')
}

export function estimateWhisperCost(duration_secs: number): number {
    const minutes = duration_secs / 60
    return parseFloat((minutes * 0.006).toFixed(4))
}
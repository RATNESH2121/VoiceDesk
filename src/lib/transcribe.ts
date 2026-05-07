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

export async function transcribeAudio(
    recordingUrl: string,
    twilioAccountSid: string,
    twilioAuthToken: string
): Promise<TranscribeResult> {

    // 1. Download audio from Twilio
    // Twilio recording URLs require Basic Auth
    const audioBuffer = await downloadTwilioAudio(
        recordingUrl,
        twilioAccountSid,
        twilioAuthToken
    )

    // 2. Convert buffer to File object (OpenAI SDK helper)
    // We specify a filename so the API knows the format
    const audioFile = await toFile(audioBuffer, 'recording.wav', { type: 'audio/wav' })

    // 3. Send to Whisper
    // language: 'hi' helps with Hindi/Hinglish accuracy
    const response = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'hi',
        prompt: 'Yeh ek clinic ka phone call hai. Caller appointment lena chahta hai, ya fees, timing, ya address pooch raha hai. Caller Hindi aur English dono bol sakta hai.',
        response_format: 'verbose_json',
    })

    // verbose_json gives us language detection and duration
    const verboseResponse = response as unknown as {
        text: string
        language: string
        duration: number
    }

    return {
        transcript: verboseResponse.text?.trim() || '',
        duration_secs: Math.ceil(verboseResponse.duration || 0),
        language_detected: verboseResponse.language || 'hi',
    }
}

// Download audio from Twilio with Basic Auth and retries
async function downloadTwilioAudio(
    recordingUrl: string,
    accountSid: string,
    authToken: string,
    retries = 3
): Promise<Buffer> {

    // Twilio recording URLs need .wav appended for raw audio
    const url = recordingUrl.endsWith('.wav')
        ? recordingUrl
        : `${recordingUrl}.wav`

    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                headers: { 'Authorization': `Basic ${credentials}` },
            })

            if (response.status === 404 && attempt < retries) {
                // Audio not ready yet — wait and retry
                console.log(`[transcribe] audio not ready, retry ${attempt}/${retries}`)
                await new Promise(resolve => setTimeout(resolve, attempt * 1000))
                continue
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            return Buffer.from(arrayBuffer)

        } catch (err) {
            if (attempt === retries) throw err
            await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
    }

    throw new Error('Failed to download audio after all retries')
}

// Utility: estimate Whisper cost for logging
export function estimateWhisperCost(duration_secs: number): number {
    // $0.006 per minute
    const minutes = duration_secs / 60
    return parseFloat((minutes * 0.006).toFixed(4))
}
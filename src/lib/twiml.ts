// src/lib/twiml.ts
// Generates TwiML XML responses for Twilio
// Reference: https://www.twilio.com/docs/voice/twiml

export function twimlResponse(content: string): Response {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${content}
</Response>`

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'text/xml',
        },
    })
}

// Say something and hang up
export function twimlSay(text: string): string {
    return `<Say voice="Polly.Aditi" language="hi-IN">${escapeXml(text)}</Say>`
}

// Say something then record the caller's response
export function twimlSayAndRecord(
    text: string,
    callbackPath: string
): string {
    return `
  <Say voice="Polly.Aditi" language="hi-IN">${escapeXml(text)}</Say>
  <Record
    maxLength="60"
    timeout="5"
    trim="trim-silence"
    action="${process.env.NEXT_PUBLIC_APP_URL}${callbackPath}"
    method="POST"
    playBeep="false"
  />
  <Say voice="Polly.Aditi" language="hi-IN">Koi response nahi mila. Phir se try karein.</Say>`
}

// Play an MP3 audio file (used from Day 13 with OpenAI TTS)
export function twimlPlay(audioUrl: string): string {
    return `<Play>${audioUrl}</Play>`
}

// Transfer call to a human
export function twimlDial(phoneNumber: string): string {
    return `<Dial timeout="20">${escapeXml(phoneNumber)}</Dial>`
}

// Gather DTMF digits (future use for menu)
export function twimlGather(
    text: string,
    callbackPath: string,
    numDigits = 1
): string {
    return `
  <Gather numDigits="${numDigits}" action="${process.env.NEXT_PUBLIC_APP_URL}${callbackPath}" method="POST">
    <Say voice="Polly.Aditi" language="hi-IN">${escapeXml(text)}</Say>
  </Gather>`
}

// Hang up
export function twimlHangup(): string {
    return `<Hangup/>`
}

// Escape XML special characters to prevent malformed TwiML
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}
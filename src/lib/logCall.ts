// src/lib/logCall.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Intent, CallOutcome } from '@/types'

interface LogCallParams {
    clinic_id: string
    twilio_call_sid: string
    caller_phone: string
    duration_secs?: number
    recording_url?: string
    transcript?: string
    intent?: Intent
    confidence?: 'high' | 'low'
    outcome?: CallOutcome
    needs_callback?: boolean
    escalated?: boolean
    appointment_id?: string
}

// Create a new call log row
export async function createCallLog(params: LogCallParams): Promise<string | null> {
    const { data, error } = await supabaseAdmin
        .from('calls')
        .insert(params)
        .select('id')
        .single()

    if (error) {
        console.error('[logCall] insert error:', error.message)
        return null
    }

    return data.id
}

// Update existing call log (used when recording arrives)
export async function updateCallLog(
    twilio_call_sid: string,
    updates: Partial<LogCallParams>
): Promise<void> {
    const { error } = await supabaseAdmin
        .from('calls')
        .update(updates)
        .eq('twilio_call_sid', twilio_call_sid)

    if (error) {
        console.error('[logCall] update error:', error.message)
    }
}

// Increment usage stats for billing
export async function incrementUsage(
    clinic_id: string,
    duration_secs: number,
    tts_chars = 0,
    llm_tokens = 0
): Promise<void> {
    const month = new Date().toISOString().slice(0, 7) // '2025-06'

    const { error } = await supabaseAdmin.rpc('increment_usage', {
        p_clinic_id: clinic_id,
        p_month: month,
        p_duration_mins: duration_secs / 60,
        p_tts_chars: tts_chars,
        p_llm_tokens: llm_tokens,
    })

    if (error) {
        // Non-fatal: log but don't crash the call flow
        console.error('[logCall] usage increment error:', error.message)
    }
}
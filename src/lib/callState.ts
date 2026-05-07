// src/lib/callState.ts
// Tracks multi-turn conversation state between Twilio webhook calls
// Uses in-memory Map for MVP (fine for single-instance Vercel deployment)
// For production with multiple instances: move this to Supabase or Redis

export interface ConversationState {
    clinic_id: string
    call_log_id: string
    caller_phone: string
    turn: number                    // how many times caller has spoken
    intent: string | null
    collected_slots: {
        patient_name: string | null
        service: string | null
        preferred_date: string | null
        preferred_time: string | null
    }
    transcript_history: string[]    // all turns joined for context
    last_updated: number            // timestamp for cleanup
}

// In-memory store keyed by Twilio CallSid
const callStates = new Map<string, ConversationState>()

export function getCallState(callSid: string): ConversationState | null {
    return callStates.get(callSid) || null
}

export function setCallState(callSid: string, state: ConversationState): void {
    callStates.set(callSid, state)
}

export function updateCallState(
    callSid: string,
    updates: Partial<ConversationState>
): ConversationState | null {
    const existing = callStates.get(callSid)
    if (!existing) return null

    const updated = { ...existing, ...updates, last_updated: Date.now() }
    callStates.set(callSid, updated)
    return updated
}

export function deleteCallState(callSid: string): void {
    callStates.delete(callSid)
}

// Clean up states older than 30 minutes (prevent memory leak)
export function cleanupOldStates(): void {
    const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000
    for (const [sid, state] of callStates.entries()) {
        if (state.last_updated < thirtyMinutesAgo) {
            callStates.delete(sid)
        }
    }
}

// Initialize fresh state when call begins
export function initCallState(
    callSid: string,
    clinic_id: string,
    call_log_id: string,
    caller_phone: string
): ConversationState {
    const state: ConversationState = {
        clinic_id,
        call_log_id,
        caller_phone,
        turn: 0,
        intent: null,
        collected_slots: {
            patient_name: null,
            service: null,
            preferred_date: null,
            preferred_time: null,
        },
        transcript_history: [],
        last_updated: Date.now(),
    }
    callStates.set(callSid, state)
    return state
}
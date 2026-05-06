export type Intent =
    | 'book_appointment'
    | 'ask_faq'
    | 'reschedule'
    | 'callback_request'
    | 'location_timing'
    | 'escalate'

export type CallOutcome =
    | 'booked'
    | 'faq_answered'
    | 'callback'
    | 'escalated'
    | 'failed'

export type PlanType = 'trial' | 'starter' | 'pro' | 'scale'

export type PaymentStatus = 'trial' | 'active' | 'expired'

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'no_show'

export interface Clinic {
    id: string
    owner_id: string
    name: string
    twilio_number: string | null
    escalation_phone: string | null
    address: string | null
    city: string | null
    timezone: string
    language: string
    brand_greeting: string
    working_hours: WorkingHours
    plan: PlanType
    payment_status: PaymentStatus
    trial_ends_at: string
    active: boolean
    created_at: string
}

export interface WorkingHours {
    mon: DayHours | null
    tue: DayHours | null
    wed: DayHours | null
    thu: DayHours | null
    fri: DayHours | null
    sat: DayHours | null
    sun: DayHours | null
}

export interface DayHours {
    open: string   // '09:00'
    close: string  // '20:00'
}

export interface Doctor {
    id: string
    clinic_id: string
    name: string
    specialization: string | null
    available_days: string[]
    slot_duration: number
    active: boolean
}

export interface FAQ {
    id: string
    clinic_id: string
    intent_bucket: string
    question_pattern: string
    answer: string
    language: string
    active: boolean
}

export interface Appointment {
    id: string
    clinic_id: string
    doctor_id: string | null
    caller_phone: string
    patient_name: string | null
    service: string | null
    preferred_date: string | null
    preferred_time: string | null
    status: AppointmentStatus
    source: string
    notes: string | null
    created_at: string
}

export interface Call {
    id: string
    clinic_id: string
    twilio_call_sid: string
    caller_phone: string | null
    duration_secs: number | null
    recording_url: string | null
    transcript: string | null
    intent: Intent | null
    confidence: string
    outcome: CallOutcome | null
    needs_callback: boolean
    escalated: boolean
    appointment_id: string | null
    created_at: string
}

export interface ExtractedSlots {
    patient_name: string | null
    caller_phone: string | null
    service: string | null
    preferred_date: string | null
    preferred_time: string | null
}
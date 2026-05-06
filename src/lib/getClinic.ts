// src/lib/getClinic.ts
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Clinic } from '@/types'

export async function getClinicByPhone(
    twilioNumber: string
): Promise<Clinic | null> {
    const { data, error } = await supabaseAdmin
        .from('clinics')
        .select('*')
        .eq('twilio_number', twilioNumber)
        .eq('active', true)
        .single()

    if (error || !data) {
        console.error('[getClinic] not found for number:', twilioNumber, error?.message)
        return null
    }

    return data as Clinic
}

// Check if clinic is currently within working hours
export function isWithinWorkingHours(clinic: Clinic): boolean {
    const now = new Date()

    // Convert to clinic's timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: clinic.timezone,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase()
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value

    if (!weekday || !hour || !minute) return true // default to open if parse fails

    // Map Intl weekday to our DB keys
    const dayMap: Record<string, string> = {
        mon: 'mon', tue: 'tue', wed: 'wed',
        thu: 'thu', fri: 'fri', sat: 'sat', sun: 'sun',
    }

    const dayKey = dayMap[weekday.slice(0, 3)]
    const hours = clinic.working_hours[dayKey as keyof typeof clinic.working_hours]

    if (!hours) return false // clinic closed on this day

    const currentTime = `${hour}:${minute}`
    return currentTime >= hours.open && currentTime <= hours.close
}
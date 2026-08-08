import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface Appointment {
  id: string
  user_id: string
  provider_name: string
  appointment_date: string // ISO timestamp
  notes: string | null
}

/**
 * Send appointment reminder email via Resend
 */
async function sendReminderEmail(
  email: string,
  providerName: string,
  appointmentDate: string,
  notes: string | null,
  resendApiKey: string
): Promise<boolean> {
  const formattedDate = new Date(appointmentDate).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Dental Appointment Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder about your upcoming dental appointment:</p>
      <ul>
        <li><strong>Provider:</strong> ${providerName}</li>
        <li><strong>Date &amp; Time:</strong> ${formattedDate}</li>
        ${notes ? `<li><strong>Notes:</strong> ${notes}</li>` : ''}
      </ul>
      <p>Please make sure to arrive a few minutes early. If you need to reschedule, please contact your provider directly.</p>
      <p>Best regards,<br>Your DentalTracker Team</p>
      <hr style="border: 1px solid #eee;">
      <p style="font-size: 0.8em; color: #666;">
        This is an automated reminder from DentalTracker. You're receiving this because you have an upcoming appointment scheduled.
      </p>
    </div>
  `

  const resendEndpoint = "https://api.resend.com/emails"
  const resendPayload = {
    from: "DentalTracker <onboarding@resend.dev>",
    to: [email],
    subject: "Upcoming Dental Appointment Reminder",
    html: emailContent,
  }

  try {
    const response = await fetch(resendEndpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendPayload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Failed to send email via Resend: ${response.status} ${errorText}`)
      return false
    }

    const result = await response.json()
    console.log(`Email sent successfully to ${email}:`, result.id)
    return true
  } catch (error) {
    console.error(`Error sending email via Resend:`, error)
    return false
  }
}

/**
 * Main function - fetches appointments needing reminders and sends emails
 */
serve(async (req) => {
  // Only allow POST requests (for security - prevent accidental GET triggers)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    })
  }

  try {
    // Extract and validate Authorization header
    const authHeader = req.headers.get("Authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid Authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const serviceRoleKey = authHeader.substring(7) // Remove "Bearer " prefix
    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Empty service role key" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Initialize Supabase client with the provided service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is not set")
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    console.log("Starting appointment reminder process...")

    // Calculate time window: now to 24 hours from now
    const now = new Date()
    const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    console.log(`Checking appointments between ${now.toISOString()} and ${twentyFourHoursLater.toISOString()}`)

    // Fetch appointments that:
    // 1. Haven't had reminder sent yet (reminder_sent = false)
    // 2. Are scheduled within the next 24 hours
    // 3. Are in the future (appointment_date >= now)
    const { data: appointments, error: appointmentsError } = await supabase
      .from<Appointment>("appointments")
      .select("id, user_id, provider_name, appointment_date, notes")
      .eq("reminder_sent", false)
      .gte("appointment_date", now.toISOString())
      .lte("appointment_date", twentyFourHoursLater.toISOString())
      .order("appointment_date", { ascending: true })

    if (appointmentsError) {
      throw appointmentsError
    }

    console.log(`Found ${appointments.length} appointments needing reminders`)

    if (appointments.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No appointments found needing reminders",
          count: 0
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    // Get Resend API key from environment variable (set as secret)
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set")
    }

    // Process each appointment
    let successfulSends = 0
    let failedSends = 0

    for (const appointment of appointments) {
      try {
        // Get user email using Supabase Admin API
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          appointment.user_id
        )

        if (userError) {
          console.error(`Failed to get user email for user_id ${appointment.user_id}:`, userError)
          failedSends++
          continue
        }

        const userEmail = userData.user?.email
        if (!userEmail) {
          console.warn(`No email found for user_id ${appointment.user_id}`)
          failedSends++
          continue
        }

        // Send the reminder email
        const emailSent = await sendReminderEmail(
          userEmail,
          appointment.provider_name,
          appointment.appointment_date,
          appointment.notes,
          RESEND_API_KEY
        )

        if (emailSent) {
          // Mark appointment as reminder sent
            const { error: updateError } = await supabase
              .from("appointments")
              .update({ reminder_sent: true })
              .eq("id", appointment.id)

            if (updateError) {
              console.error(`Failed to update appointment ${appointment.id} as reminder_sent:`, updateError)
              // Even if update fails, we counted the email as sent
              successfulSends++
            } else {
              successfulSends++
              console.log(`Reminder sent and marked for appointment ${appointment.id}`)
            }
        } else {
          failedSends++
          console.log(`Failed to send reminder for appointment ${appointment.id}`)
        }
      } catch (appointmentError) {
        console.error(`Error processing appointment ${appointment.id}:`, appointmentError)
        failedSends++
      }
    }

    console.log(`Reminder process completed. Successful: ${successfulSends}, Failed: ${failedSends}`)

    return new Response(
      JSON.stringify({
        message: "Appointment reminder process completed",
        successful: successfulSends,
        failed: failedSends,
        total: appointments.length
      }),
      {
        headers: { "Content-Type": "application/json" }
      }
    )

  } catch (error) {
    console.error("Error in appointment reminder function:", error)
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
})
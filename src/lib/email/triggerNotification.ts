/**
 * Trigger email notification for a disdetta
 * Can be called from Edge Functions, API routes, or server components
 */
export async function triggerEmailNotification(
  disdettaId: number,
  type: 'ready' | 'sent' | 'error'
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/send-notification-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        disdettaId,
        type,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Failed to trigger notification:', error)
      return { success: false, error }
    }

    const result = await response.json()
    console.log('Notification triggered successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Error triggering notification:', error)
    return { success: false, error }
  }
}

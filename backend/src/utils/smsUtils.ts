/**
 * Send SMS
 * @param options - SMS options
 * @returns Promise that resolves when SMS is sent
 */
export async function sendSms(options: {
    to: string
    message: string
  }): Promise<void> {
    // In a real implementation, this would use an SMS service like Twilio, Nexmo, etc.
    // For now, we'll just log the SMS
    console.log(`Sending SMS to ${options.to}`)
    console.log(`Message: ${options.message}`)
  
    // Simulate SMS sending delay
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  
  
// Email service using Netlify functions in production and local backend in development
export interface EmailData {
  to: string;
  subject: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
}

export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  try {
    // Use Netlify functions in production, local backend in development
    const isProduction = import.meta.env.PROD;
    const apiUrl = isProduction 
      ? '/.netlify/functions/send-email'
      : 'http://localhost:4242/api/send-email';

    // Call our backend endpoint which handles Mailjet API calls
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('📧 Email sent successfully via backend:', result);
      return true;
    } else {
      console.error('❌ Email sending failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error calling email service:', error);
    return false;
  }
};

export default { sendEmail }; 
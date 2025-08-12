const Mailjet = require('node-mailjet');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { to, subject, htmlContent, fromEmail, fromName } = JSON.parse(event.body);

    // Validate required fields
    if (!to || !subject || !htmlContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: to, subject, htmlContent' })
      };
    }

    // Get API credentials from environment variables
    const apiKey = process.env.MAILJET_API_KEY || 'a5f02038e308caad17bfd205d8a9dcd0';
    const apiSecret = process.env.MAILJET_API_SECRET || 'be327dee084cf1ac0b0370f036fc1591';

    // Initialize Mailjet
    const mailjet = Mailjet.connect(apiKey, apiSecret);

    // Send email
    const request = mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: fromEmail || 'info@quibble.online',
            Name: fromName || 'Quibble Wellness Store'
          },
          To: [
            {
              Email: to,
              Name: to.split('@')[0] // Use email prefix as name
            }
          ],
          Subject: subject,
          HTMLPart: htmlContent
        }
      ]
    });

    const response = await request;
    
    console.log('📧 Email sent successfully:', response.body);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        data: response.body
      })
    };

  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to send email',
        details: error.message
      })
    };
  }
}; 
const crypto = require('crypto');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'http://localhost:8080',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' }),
      };
    }

    // Generate a random CSRF token
    const token = crypto.randomBytes(32).toString('hex');
    
    // In a real implementation, you might want to store this token
    // in a database or cache for validation

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        token,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}; 
const { Handler } = require('@netlify/functions');
const serverless = require('serverless-http');
const express = require('express');
const server = require('../../server');

const handler = serverless(server);

exports.handler = async (event, context) => {
  // Handle API routes
  if (event.path && event.path.startsWith('/api/')) {
    return handler(event, context);
  }
  
  // For all other routes, serve the SPA
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading...</title>
          <script>
            window.location.href = '/';
          </script>
        </head>
        <body>
          <p>Loading...</p>
        </body>
      </html>
    `,
  };
};

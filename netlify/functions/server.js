const { createServer } = require('@netlify/functions')
const express = require('express')
const serverless = require('serverless-http')
const app = require('../server/index').app

// This is the Express app that handles all routes
exports.handler = createServer({
  proxy: {
    '/api': {
      target: 'http://localhost:8888',
      pathRewrite: { '^/api/': '/' },
      changeOrigin: true,
    },
  },
  request: (req, res, context) => {
    // Handle the request with Express
    const handler = serverless(app)
    return handler(req, res, context)
  }
})

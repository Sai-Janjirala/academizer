/**
 * AI Routes — Node.js Proxy to the Python FastAPI AI Service
 *
 * All AI heavy-lifting (Gemini calls, DB snapshot) is done in Python (ai_service/main.py).
 * This file simply proxies frontend requests to http://localhost:8000.
 */

const express = require('express');
const router = express.Router();

const PYTHON_AI_URL = process.env.PYTHON_AI_URL || 'http://localhost:8000';

/**
 * Generic proxy helper — forwards the request to the Python service and
 * pipes the JSON response back.
 */
const proxyTo = async (path, method, body, res) => {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    const upstream = await fetch(`${PYTHON_AI_URL}${path}`, opts);
    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json(data);
    }
    return res.json(data);
  } catch (err) {
    console.error(`[AI Proxy] ${method} ${path} →`, err.message);
    return res.status(503).json({
      error: `AI service unavailable. Make sure the Python service is running on port 8000. (${err.message})`
    });
  }
};

// POST /api/ai/ask  — multi-turn conversational chat
router.post('/ask', (req, res) => proxyTo('/ask', 'POST', req.body, res));

// GET /api/ai/summary — auto-generated dashboard insights
router.get('/summary', (_req, res) => proxyTo('/summary', 'GET', null, res));

// GET /api/ai/stats — real stat card numbers
router.get('/stats', (_req, res) => proxyTo('/stats', 'GET', null, res));

// GET /api/ai/health — check if Python service is up
router.get('/health', (_req, res) => proxyTo('/health', 'GET', null, res));

module.exports = router;

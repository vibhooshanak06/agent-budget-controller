'use strict';

/**
 * openai.service.js
 *
 * Thin wrapper around the official OpenAI Node.js SDK.
 *
 * Responsibilities:
 *   - Initialise the OpenAI client once (singleton)
 *   - Send chat completion requests
 *   - Return the response text and raw token usage
 *   - Map provider-specific errors to AppErrors with meaningful messages
 *   - Log every outbound request and inbound response
 *
 * This service knows nothing about budgets or cost calculation.
 * It only communicates with OpenAI and returns raw data.
 */

const OpenAI = require('openai');
const env    = require('../config/env');
const logger = require('../config/logger');
const AppError = require('../utils/AppError');

// ── Singleton client ──────────────────────────────────────────────────────────

const client = new OpenAI({
  apiKey:  env.OPENAI_API_KEY,
  timeout: env.OPENAI_TIMEOUT_MS,
  maxRetries: 2, // SDK-level retries for transient 5xx errors
});

// ── Request ───────────────────────────────────────────────────────────────────

/**
 * Send a prompt to OpenAI and return the response.
 *
 * @param {object} opts
 * @param {string}   opts.model  - Model identifier (e.g. 'gpt-4o-mini')
 * @param {string}   opts.prompt - User message text
 * @param {string}   [opts.systemPrompt] - Optional system instruction
 * @returns {Promise<{
 *   text: string,
 *   model: string,
 *   promptTokens: number,
 *   completionTokens: number,
 *   totalTokens: number,
 *   finishReason: string
 * }>}
 */
async function createChatCompletion({ model, prompt, systemPrompt }) {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  logger.info({ model, promptLength: prompt.length }, 'Sending request to OpenAI');

  const startTime = Date.now();

  try {
    const completion = await client.chat.completions.create({
      model,
      messages,
    });

    const latencyMs = Date.now() - startTime;
    const choice    = completion.choices[0];
    const usage     = completion.usage;

    logger.info(
      {
        model:            completion.model,
        promptTokens:     usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens:      usage?.total_tokens,
        finishReason:     choice?.finish_reason,
        latencyMs,
      },
      'OpenAI response received',
    );

    return {
      text:             choice?.message?.content ?? '',
      model:            completion.model,           // use the actual resolved model name
      promptTokens:     usage?.prompt_tokens     ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens:      usage?.total_tokens      ?? 0,
      finishReason:     choice?.finish_reason    ?? 'unknown',
      latencyMs,
    };

  } catch (err) {
    const latencyMs = Date.now() - startTime;
    logger.error({ err, model, latencyMs }, 'OpenAI request failed');

    // Map OpenAI SDK errors to AppErrors with appropriate HTTP status codes
    throw mapOpenAIError(err);
  }
}

// ── Error mapping ─────────────────────────────────────────────────────────────

/**
 * Convert OpenAI SDK errors into AppErrors.
 * The OpenAI SDK throws typed errors that we can inspect by status code.
 *
 * @param {Error} err
 * @returns {AppError}
 */
function mapOpenAIError(err) {
  // Already an AppError — pass through
  if (err instanceof AppError) return err;

  // OpenAI API errors carry a .status property
  if (err?.status) {
    switch (err.status) {
      case 401:
        return new AppError(
          'OpenAI authentication failed. Check your OPENAI_API_KEY.',
          502,
          'OPENAI_AUTH_ERROR',
        );
      case 429:
        return new AppError(
          'OpenAI rate limit reached. Please retry after a moment.',
          429,
          'OPENAI_RATE_LIMIT',
        );
      case 500:
      case 502:
      case 503:
        return new AppError(
          'OpenAI service is temporarily unavailable. Please retry.',
          503,
          'OPENAI_UNAVAILABLE',
        );
      default:
        return new AppError(
          `OpenAI API error: ${err.message ?? 'Unknown error'}`,
          502,
          'OPENAI_API_ERROR',
        );
    }
  }

  // Timeout / network error
  if (err.code === 'ETIMEDOUT' || err.name === 'APIConnectionTimeoutError') {
    return new AppError(
      `OpenAI request timed out after ${env.OPENAI_TIMEOUT_MS}ms.`,
      504,
      'OPENAI_TIMEOUT',
    );
  }

  // Unknown error
  return new AppError(
    'Unexpected error communicating with OpenAI.',
    502,
    'OPENAI_UNKNOWN_ERROR',
  );
}

module.exports = { createChatCompletion };

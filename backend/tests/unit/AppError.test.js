'use strict';

const AppError = require('../../src/utils/AppError');

describe('AppError', () => {
  test('sets all properties correctly', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND', { id: 'xyz' });
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.code).toBe('NOT_FOUND');
    expect(err.details).toEqual({ id: 'xyz' });
    expect(err.isOperational).toBe(true);
  });

  test('sets status to "error" for 5xx codes', () => {
    const err = new AppError('Server error', 500);
    expect(err.status).toBe('error');
  });

  test('is an instance of Error', () => {
    expect(new AppError('test', 400)).toBeInstanceOf(Error);
  });

  test('captures stack trace', () => {
    const err = new AppError('test', 400);
    expect(err.stack).toBeDefined();
    expect(err.stack).not.toContain('AppError'); // constructor excluded from trace
  });
});

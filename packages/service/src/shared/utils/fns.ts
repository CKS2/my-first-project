import type { APIGatewayProxyResult } from 'aws-lambda';

import { getLogger } from './logger';

const logger = getLogger();

/**
 * Delete null or undefined properties
 */
export function deleteEmptyProperties<T extends object>( // eslint-disable-line @typescript-eslint/ban-types
  objectToClean: T,
  options: DeleteEmptyPropertiesOptions = { deleteNull: true, deleteUndefined: true }
): { [key in keyof T]-?: T[key] extends null | undefined ? never : NonNullable<T[key]> } {
  if (options.deleteNull !== false) {
    options.deleteNull = true;
  }
  if (options.deleteUndefined !== false) {
    options.deleteUndefined = true;
  }

  Object.keys(objectToClean).forEach((key) => {
    if (
      (objectToClean[key as keyof T] === undefined && options.deleteUndefined) ||
      (objectToClean[key as keyof T] === null && options.deleteNull)
    ) {
      delete objectToClean[key as keyof T];
    }
  });
  return objectToClean as {
    [key in keyof T]-?: T[key] extends null | undefined ? never : NonNullable<T[key]>;
  };
}

export class APIError<T extends string = string> extends Error {
  static STATUS = {
    ok: 200,
    moved_temporarily: 302,
    moved_permanently: 301,
    bad_request: 400,
    invalid_request: 422,
    unauthenticated: 401,
    unauthorized: 403,
    not_found: 404,
    not_allowed: 405,
    internal_error: 500,
    service_unavailable: 503,
  };

  static isAPIError(e: unknown): e is APIError {
    return e instanceof APIError;
  }

  static throwIfNotKnown(e: unknown, apiError: APIError): never {
    if (APIError.isAPIError(e)) {
      throw e;
    } else {
      // eslint-disable-next-line no-console
      console.error(e);
      throw apiError;
    }
  }

  statusCode: number = APIError.STATUS.internal_error;
  code: T | undefined;
  id: string | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<any, any> | undefined;

  constructor(status: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = status;
  }

  setCode(code: T): APIError {
    this.code = code;
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setData(data: Record<any, any>): APIError {
    this.data = data;
    return this;
  }

  setId(id: string): APIError {
    this.id = id;
    return this;
  }

  getBody(): { message: string; statusCode: number; code?: T; id?: string } {
    return {
      message: this.message,
      statusCode: this.statusCode,
      ...(this.id ? { id: this.id } : null),
      ...(this.code ? { code: this.code } : null),
      ...(this.data ? { data: this.data } : null),
    };
  }
}

export class APIGatewayResponse<T = unknown> {
  private _body: T | undefined;
  private _headers: Record<string, string> = {};
  private _statusCode = 200;

  constructor(status: number) {
    this._statusCode = status;
  }

  body(body: T): APIGatewayResponse<T> {
    this._body = body;
    return this;
  }

  headers(headers: Record<string, string>): APIGatewayResponse<T> {
    this._headers = { ...this._headers, ...headers };
    return this;
  }

  enableCors(): APIGatewayResponse<T> {
    this._headers = {
      ...this._headers,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    return this;
  }

  statusCode(status: number): APIGatewayResponse<T> {
    this._statusCode = status;
    return this;
  }

  make(log?: boolean): APIGatewayProxyResult {
    const response = {
      statusCode: this._statusCode,
      body: this._body
        ? typeof this._body === 'string'
          ? this._body
          : JSON.stringify(this._body)
        : '',
      headers: this._headers,
    };
    if (log === true) {
      logger.info('Response', { data: { response } });
    }
    return response;
  }
}

/**
 * Returns a promise that resolves in ${timeInSeconds} seconds
 */
export function sleepForSeconds(timeInSeconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeInSeconds * 1000);
  });
}

/**
 * Retries a function n number of times before giving up
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function retry<T extends (...arg0: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxTry: number,
  retryCount = 1
): Promise<Awaited<ReturnType<T>>> {
  const currRetry = typeof retryCount === 'number' ? retryCount : 1;
  try {
    const result = await fn(...args);
    return result;
  } catch (e) {
    logger.info(`Retry ${currRetry} failed.`);
    if (currRetry > maxTry) {
      logger.info(`All ${maxTry} retry attempts exhausted`);
      throw e;
    }
    return retry(fn, args, maxTry, currRetry + 1);
  }
}

/**
 * Retries a function n number of times before giving up
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function retryWithBackoff<T extends (...arg0: any[]) => any>(
  fn: T,
  args: Parameters<T>,
  maxTry: number,
  retryCount = 0
): Promise<Awaited<ReturnType<T>>> {
  const currRetry = typeof retryCount === 'number' ? retryCount : 0;
  try {
    const result = await fn(...args);
    return result;
  } catch (e) {
    logger.info(`Retry ${currRetry} failed.`);
    if (currRetry > maxTry) {
      logger.info(`All ${maxTry} retry attempts exhausted`);
      throw e;
    }
    await sleepForSeconds(currRetry * 0.5);
    return retryWithBackoff(fn, args, maxTry, currRetry + 1);
  }
}

interface DeleteEmptyPropertiesOptions {
  deleteNull?: boolean;
  deleteUndefined?: boolean;
}

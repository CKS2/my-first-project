import type { AxiosError } from 'axios';
import type { Log } from 'logger-ts';

const emptyOptions: Log.LogGlobalMeta = {};

const empty: Log.LogMeta = {};

/**
 * JSON stringify function to correctly print error
 */
function replacer(key: unknown, value: unknown): unknown {
  if (value instanceof Error) {
    return value.message + ' ' + value.stack;
  }

  return value;
}

const Namespace = `${GLOBAL_VAR_SERVICE_NAME}-${GLOBAL_VAR_NODE_ENV}`;

/**
 * Logs the parameters to the console
 */
function log(
  level: Log.LogLevels,
  message: string,
  meta: Log.LogMeta | Log.LogMetaMetric = empty
): void {
  try {
    if ((level === 'debug' && GLOBAL_VAR_NODE_ENV === 'prod') || GLOBAL_VAR_IS_TEST) {
      return;
    }
    if ('name' in meta) {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          message: `[Embedded Metric] ${meta.activity}`,
          [meta.name]: typeof meta.value === 'number' ? meta.value : 1,
          ['Activity']: meta.activity,
          ...meta.tags.reduce((acc, curr) => {
            acc[curr[0]] = curr[1];
            return acc;
          }, {} as Record<string, string>),
          requestId: meta.traceId,
          _aws: {
            Timestamp: Date.now(),
            CloudWatchMetrics: [
              {
                Namespace,
                Dimensions: [
                  ['Activity', ...meta.tags.map((groupPair) => groupPair[0])],
                  ['Activity'],
                  ...meta.tags.map((groupPair) => [groupPair[0]]),
                ],
                Metrics: [
                  {
                    Name: meta.name,
                    Unit: meta.name === 'Duration' ? 'Milliseconds' : 'Count',
                  },
                ],
              },
            ],
          },
        })
      );
    } else {
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify(
          {
            level,
            message,
            meta: meta === empty ? undefined : meta,
            date: new Date().toISOString(),
            service: GLOBAL_VAR_SERVICE_NAME,
            env: GLOBAL_VAR_NODE_ENV,
          },
          replacer
        )
      );
    }
  } catch {}
}

/**
 * Returns a logger that you can use inside a function.
 * Always create a new logger inside a function or a module.
 */
const getLogger = (): Log.Logger => {
  return {
    append: {},
    error(message, err, meta) {
      const metaAttr: Log.LogMeta = {
        ...(meta ? meta : null),
        data: {
          ...(meta?.data ? meta.data : null),
          reason: err && (err as Error)?.message,
          stack: err && (err as Error)?.stack,
        },
      };
      if (err && (err as AxiosError).isAxiosError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpUrl = (err as AxiosError).config.url;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseBody = (err as AxiosError).response?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestBody = (err as AxiosError).config?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestHeaders = (err as AxiosError).config.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseHeaders = (err as AxiosError).response?.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseStatus = (err as AxiosError).response?.status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpCode = (err as AxiosError).code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpMessage = (err as AxiosError<any>).response?.data?.message;
      }
      if (this.append.traceId) {
        metaAttr.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        metaAttr.handler = this.append.handler;
      }
      log('error', message, metaAttr);
    },
    warn(message, err, meta) {
      const metaAttr: Log.LogMeta = {
        ...(meta ? meta : null),
        data: {
          ...(meta?.data ? meta.data : null),
          reason: err && (err as Error)?.message,
          stack: err && (err as Error)?.stack,
        },
      };
      if (err && (err as AxiosError).isAxiosError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpUrl = (err as AxiosError).config.url;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseBody = (err as AxiosError).response?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestBody = (err as AxiosError).config?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestHeaders = (err as AxiosError).config.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseHeaders = (err as AxiosError).response?.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseStatus = (err as AxiosError).response?.status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpCode = (err as AxiosError).code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpMessage = (err as AxiosError<any>).response?.data?.message;
      }
      if (this.append.traceId) {
        metaAttr.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        metaAttr.handler = this.append.handler;
      }
      log('warn', message, metaAttr);
    },
    info(message, meta = empty) {
      if (this.append.traceId) {
        meta.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        meta.handler = this.append.handler;
      }
      log('info', message, meta);
    },
    http(message, meta = empty) {
      if (this.append.traceId) {
        meta.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        meta.handler = this.append.handler;
      }
      log('http', message, meta);
    },
    debug(message, meta = empty) {
      if (this.append.traceId) {
        meta.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        meta.handler = this.append.handler;
      }
      log('debug', message, meta);
    },
    crit(message, err, meta) {
      const metaAttr: Log.LogMeta = {
        ...(meta ? meta : null),
        data: {
          ...(meta?.data ? meta.data : null),
          reason: err && (err as Error)?.message,
          stack: err && (err as Error)?.stack,
        },
      };
      if (err && (err as AxiosError).isAxiosError) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpUrl = (err as AxiosError).config.url;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseBody = (err as AxiosError).response?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestBody = (err as AxiosError).config?.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpRequestHeaders = (err as AxiosError).config.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseHeaders = (err as AxiosError).response?.headers;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpResponseStatus = (err as AxiosError).response?.status;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpCode = (err as AxiosError).code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (metaAttr.data as any).httpMessage = (err as AxiosError<any>).response?.data?.message;
      }
      if (this.append.traceId) {
        metaAttr.traceId = this.append.traceId;
      }
      if (this.append.handler) {
        metaAttr.handler = this.append.handler;
      }
      log('error', message, metaAttr);
    },
    metric(meta: Log.LogMetaMetric): void {
      if (this.append.traceId) {
        meta.traceId = this.append.traceId;
      }
      log('metric', '', meta);
    },
  };
};

/**
 * Wraps the handler function to make global changes to log state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loggify<T extends (...args: any[]) => any>(
  handlerNamespace: Log.LogHandlers,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: Log.LoggifyHandler<T>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async function loggifiedHandler(...args: any[]): Promise<any> {
    const logger = getLogger();
    logger.append.handler = handlerNamespace;
    const timeNow = Date.now();
    try {
      const handlerFunc = handler({ logger: logger });
      const resp = await handlerFunc.apply(emptyOptions, args);
      const timeElapsed = Date.now() - timeNow;
      logger.metric({
        name: 'Duration',
        tags: [['Type', 'aws']],
        activity: `${handlerNamespace}`,
        value: timeElapsed,
      });
      return resp;
    } catch (e: unknown) {
      logger.error('Lambda Execution Finished With UnCaught Error', e as Error);
      logger.metric({
        name: 'Duration',
        tags: [['Type', 'aws']],
        activity: handlerNamespace,
        value: 1,
      });
      logger.metric({
        name: 'FailedCount',
        tags: [['Type', 'aws']],
        activity: handlerNamespace,
        value: 1,
      });
      throw e;
    }
  };
}

export { loggify, getLogger };

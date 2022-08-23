import type { AxiosError, AxiosInstance } from 'axios';
import type { Utils } from 'utils-ts';
import type { Log } from 'logger-ts';

import { HttpsAgent, default as Agent } from 'agentkeepalive';
import axios from 'axios';

const TIME_HEADER_NAME = 'CSTM-REQ-STRT-TIME';

const httpAgent = new Agent({
  keepAlive: true,
  maxSockets: Infinity,
  maxFreeSockets: 25,
  freeSocketTimeout: 60000, // Free socket live for 60 seconds
});

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  maxSockets: Infinity,
  maxFreeSockets: 25,
  freeSocketTimeout: 60000, // Free socket live for 60 seconds
});

const ignoreErrorStatus: Record<number, 1> = {};

/**
 * Return an Axios instance with some pre-configured logging
 * mechanism in place.
 *
 */
function http(namespace: Log.HttpAPIs, context: Context): AxiosInstance {
  const axiosInstance = axios.create({
    httpAgent: httpAgent,
    httpsAgent: httpsAgent,
  });

  const ignoreErrorStatusMap = context.ignoreErrorStatusMap || ignoreErrorStatus;

  const logger = context.logger;

  const logFailed = context.level ? logger[context.level].bind(logger) : logger.error.bind(logger);

  axiosInstance.interceptors.request.use(
    function request(config) {
      if (!config.headers) {
        return config;
      }

      config.headers[TIME_HEADER_NAME] = String(Date.now());

      logger.http(`HTTP Request Sent`, { data: { url: config.url }, activity: namespace });
      return config;
    },
    function error(error) {
      logFailed('HTTP Request Failed', error, {
        activity: namespace,
      });
      logger.metric({
        activity: namespace,
        name: 'FailedCount',
        tags: [['Type', 'http']],
        value: 1,
      });
      return Promise.reject(error);
    }
  );

  axiosInstance.interceptors.response.use(
    function successResponse(response) {
      if (!response.config.headers) {
        return response;
      }

      if (!process.env.DONT_LOG_SUCCESS_HTTP) {
        const milliSecElapsed =
          Date.now() - parseInt(String(response.config.headers[TIME_HEADER_NAME]));
        logger.http('HTTP Request Successful', {
          data: { status: response.status, url: response.config.url },
          activity: namespace,
        });
        logger.metric({
          name: 'Duration',
          activity: namespace,
          tags: [['Type', 'http']],
          value: milliSecElapsed,
        });
      }

      return response;
    },
    function errorResponse(error: AxiosError) {
      if (error.response) {
        /*
         * The request was made and the server responded with a
         * status code that falls out of the range of 2xx
         */
        logFailed('HTTP Remote Server Sent Error', error, {
          activity: namespace,
        });
        if (ignoreErrorStatusMap[error.response.status] !== 1) {
          logger.metric({
            name: 'FailedCount',
            tags: [['Type', 'http']],
            activity: namespace,
            value: 1,
          });
        } else {
          return undefined;
        }
      } else if (error.request) {
        /*
         * The request was made but no response was received, `error.request`
         * is an instance of XMLHttpRequest in the browser and an instance
         * of http.ClientRequest in Node.js
         */
        logFailed('HTTP No Response From Server', error, {
          activity: namespace,
        });
        logger.metric({
          name: 'FailedCount',
          tags: [['Type', 'http']],
          activity: namespace,
          value: 1,
        });
      } else {
        /**
         * Something happened in setting up the request and triggered an Error
         */
        logFailed('HTTP Node Request Failed', error, {
          activity: namespace,
        });
        logger.metric({
          name: 'FailedCount',
          tags: [['Type', 'http']],
          activity: namespace,
          value: 1,
        });
      }
      return Promise.reject(error);
    }
  );
  return axiosInstance;
}

export { http };

interface Context extends Utils.Context {
  level?: Extract<Log.LogLevels, 'error' | 'warn'>;
  ignoreErrorStatusMap?: Record<number, 1>;
}

import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import { trace } from '@opentelemetry/api';

const traceContextFormat = winston.format((info) => {
  const span = trace.getActiveSpan();
  if (span) {
    const ctx = span.spanContext();
    info.trace_id = ctx.traceId;
    info.span_id = ctx.spanId;
  }
  return info;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      nestWinstonModuleUtilities.format.nestLike('pinduoduo', { prettyPrint: true }),
    ),
  }),
  new winston.transports.DailyRotateFile({
    dirname: process.env.LOG_DIR ?? './logs',
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    format: winston.format.combine(
      traceContextFormat(),
      winston.format.timestamp(),
      winston.format.json(),
    ),
  }),
];

export const winstonLoggerOptions: winston.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  transports,
};

export const createWinstonModule = () =>
  WinstonModule.forRoot(winstonLoggerOptions);

import winston from 'winston';

export default winston.createLogger({
  level: 'verbose',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

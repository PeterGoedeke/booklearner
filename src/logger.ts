import winston from 'winston'

export default class Logger {
    public static getLogger(label: string): winston.Logger {
        if (!winston.loggers.has(label)) {
            winston.loggers.add(label, {
                transports: Logger.transports,
                format: winston.format.label({ label }),
            })
        }
        return winston.loggers.get(label)
    }

    private static logFormat = winston.format.printf(
        info => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
    )

    private static readonly transports = [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.colorize(),
                Logger.logFormat
            )
        }),
        new winston.transports.File({
            filename: 'logs/combined.log',
            format: winston.format.json()
        }),
        new winston.transports.File({
            level: 'error',
            filename: 'logs/error.log',
            format: winston.format.json()
        })
    ]
}
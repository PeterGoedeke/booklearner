import dotenv from 'dotenv'
dotenv.config()

import express, { NextFunction, Request, Response } from 'express'
import path from 'path'
import * as OpenApiValidator from 'express-openapi-validator'
import { ValidationError, ValidationErrorItem } from 'express-openapi-validator/dist/framework/types'
import Logger from './logger'
import expressWinston from 'express-winston'

const app = express()
app.use(express.json())
app.use(express.text())
app.use(express.urlencoded({ extended: true }))

app.use(expressWinston.logger({
    winstonInstance: Logger.getLogger('express'),
    msg: '{{req.hostname}} - - - "{{req.method}} {{req.url}} HTTP{{req.httpVersion}}" {{res.statusCode}} -',
    colorize: true
}))


app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => {
    return res.status(200).json({
        version: 'v0.1.0'
    })
})

app.use(
    OpenApiValidator.middleware({
        apiSpec: './src/spec.yaml',
        validateRequests: true,
        validateResponses: true,
        operationHandlers: path.join(__dirname + '/controllers')
    })
)

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (!(err.status && err.errors)) {
        return next(err)
    }
    const verror = err as ValidationError
    if (res.headersSent) {
        return next(verror)
    }
    Logger.getLogger('validation').warn(`${verror.errors[0].path} ${verror.errors[0].message}`)
    return res.status(verror.status).json({
        error: verror
    })
})

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err)
    }
    Logger.getLogger('controller').error(`${err.stack}`)

    const displayError = process.env.NODE_ENV === 'production'
        ? 'An unexpected error has occurred. Please try again later.'
        : err.stack
    return res.status(500).json({
        error: displayError
    })
})

app.listen(process.env.PORT, () => {
    // tslint:disable-next-line: no-console
    Logger.getLogger('express').info(`Server started at port ${process.env.PORT}`)
})

const signals = [
    'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
    'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
]
signals.forEach(signal => {
    process.on(signal, () => {
        Logger.getLogger('general').info(`Received ${signal}, closing server...`)
        process.exit(1)
    })
})
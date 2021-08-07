import Logger from '../logger';
import { FormData, Parser } from './parser';

const logger = Logger.getLogger('parsers')

export class TextParser extends Parser {
    public async parse(data: FormData) {
        if (typeof data.fields.text === 'string') {
            logger.info('Successfully parsed text')
            return data.fields.text
        }
        logger.debug(`Failed to parse text`)
        return ''
    }
    public canParse(data: FormData) {
        return typeof data.fields.text === 'string'
    }
}
import { FormData, Parser } from './parser';
import fs from 'fs'
import pdf from 'pdf-parse'
import Logger from '../logger';

const logger = Logger.getLogger('parsers')

export class PDFParser extends Parser {
    public async parse(data: FormData) {
        if (!!data.file && data.file.type === 'application/pdf') {
            const fileData = await fs.promises.readFile(data.file.path)
            const result = await pdf(fileData)
            logger.info(`Parsed PDF named ${data.file?.name}`)
            return result.text
        }
        logger.debug(`Failed to parse PDF named ${data.file?.name}`)
        return ''
    }
    public canParse(data: FormData) {
        return !!data.file && data.file.type === 'application/pdf'
    }
}
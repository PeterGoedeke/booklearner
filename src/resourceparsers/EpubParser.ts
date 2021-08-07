import { FormData, Parser } from './parser'
import fs from 'fs'
import Logger from '../logger'
import { parseEpub } from '@gxl/epub-parser'
import striptags from 'striptags'

const logger = Logger.getLogger('parsers')

export class EpubParser extends Parser {
    public async parse(data: FormData) {
        if (!!data.file && data.file.type === 'application/epub+zip') {
            const fileData = await fs.promises.readFile(data.file.path)
            const result = await parseEpub(fileData)
            if (result.sections) {
                logger.info(`Parsed Epub named ${data.file?.name}`)
                return result.sections
                    .map(section => striptags(section.htmlString))
                    .reduce((acc, cur) => acc + cur)
            }
        }
        logger.debug(`Failed to parse Epub named ${data.file?.name}`)
        return ''
    }
    public canParse(data: FormData) {
        return !!data.file && data.file.type === 'application/epub+zip'
    }
}
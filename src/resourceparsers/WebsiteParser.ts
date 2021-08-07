import { FormData, Parser } from './parser';

export class WebsiteParser extends Parser {
    public async parse(data: FormData) {
        return ''
    }
    public canParse(data: FormData) {
        return false
        // return typeof data.fields.url === 'string'
    }
}
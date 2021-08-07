import { FormData, Parser } from './parser';
import { EpubParser } from "./EpubParser";
import { PDFParser } from "./PDFParser";
import { WebsiteParser } from "./WebsiteParser";
import { TextParser } from "./TextParser";

export class MasterParser extends Parser {
    private parsers: Parser[]
    constructor() {
        super()
        this.parsers = [
            new EpubParser(),
            new PDFParser(),
            new WebsiteParser(),
            new TextParser()
        ]
    }
    public async parse(data: FormData) {
        for (const parser of this.parsers) {
            if (parser.canParse(data)) {
                return await parser.parse(data)
            }
        }
        return ''
    }
    public canParse(data: FormData) {
        for (const parser of this.parsers) {
            if (parser.canParse(data)) {
                return true
            }
        }
        return false
    }
}
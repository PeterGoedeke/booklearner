import formidable from 'formidable'
import { File } from 'formidable'

export abstract class Parser {
    public abstract parse(data: FormData): Promise<string>
    public abstract canParse(data: FormData): boolean
}

export interface FormData {
    fields: formidable.Fields,
    file: File | undefined
}
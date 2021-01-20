// libraries used for pdf loading and processing
const formidable = require('formidable')
const fs = require('fs')
const pdf = require('pdf-parse')

const translate = require('./cinnamon')
const parseWebsite = require('./cinnamon/parseWebsite')
const { textToWords } = require('./cinnamon/parseText')
const dictionary = require('./cinnamon/dictionary')

const testInvalidLanguageFields = (validFields, fields) =>
    !validFields.has(fields.source) || !validFields.has(fields.dest) || fields.source === fields.dest

function translateController(req, res) {
    const form = formidable({ multiples: true })
    form.parse(req, async (err, fields, files) => {
        const validFields = new Set(Object.getOwnPropertyNames(dictionary))
        if (testInvalidLanguageFields(validFields, fields)) {
            return res.status(400).render('error', {
                message: 'Invalid language fields.',
                error: {
                    status: 400,
                    stack: 'This shouldn\'t be possible...'
                }
            })
        }
        const blacklist = new Set(fields.blacklist ? textToWords(fields.source, fields.blacklist) : [])

        const inputs = [fields.text, files.file.type == 'application/pdf', fields.url].filter(i => i)
        if (inputs.length == 0) {
            return res.status(400).render('error', {
                message: 'Either submit a pdf, add text to be translated to the text field, or enter a url in the url field',
                error: {
                    status: 400,
                    stack: 'Submit something to be translated!'
                }
            })
        }
        let words = []
        if (files.file.type == 'application/pdf') {
            try {
                const data = await fs.promises.readFile(files.file.path)
                const result = await pdf(data)
                if (result.text) {
                    words = textToWords(fields.source, result.text)
                }
            }
            catch (e) {
                console.log(e)
                return res.status(500)
                    .render('error', {
                        message: 'Failed to parse document',
                        error: {
                            status: 500,
                            stack: e
                        }
                    })
            }
        }
        if (fields.text) {
            words = words.concat(textToWords(fields.source, fields.text))
        }
        if (fields.url) {
            try {
                const text = await parseWebsite(fields.url)
                if (text != null) {
                    words = words.concat(textToWords(fields.source, text))
                }
            }
            catch (e) {
                console.log(e)
                return res.status(400)
                    .render('error', {
                        message: 'Failed to parse URL',
                        error: {
                            status: 400,
                            stack: e
                        }
                    })
            }
        }
        const translateWords = words.filter(word => !blacklist.has(word))

        const translationResult = await translate(translateWords, fields.source, fields.dest)
        if (translationResult.error) {
            return res.status(translationResult.status)
                .render('error', {
                    message: `A ${translationResult.type} error has occurred in translation`,
                    error: {
                        status: translationResult.status,
                        stack: translationResult.message
                    }
                })
        }

        return res.status(200)
            .attachment(`vocabulary.csv`)
            .send(translationResult)
            // if (!toTranslate || toTranslate.type != 'application/pdf') {
        //     return res.status(400).render('error', {
        //         message: 'Either no file was submitted or the format of the submitted file was not supported.',
        //         error: {
        //             status: 400,
        //             stack: 'Supported file types right now are limited to pdf files.'
        //         }
        //     })
        // }    
    })
}


module.exports = {
    translate: translateController
}
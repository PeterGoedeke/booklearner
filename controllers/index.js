// library dependencies
const { concat } = require('ramda')

// libraries used for pdf loading and processing
const formidable = require('formidable')
const fs = require('fs')
const pdf = require('pdf-parse')

const translate = require('./cinnamon')
const parseWebsite = require('./cinnamon/parseWebsite')
const { countWords, uniq, parseText } = require('./cinnamon/parseText')
const epubPathToText = require('./cinnamon/parseEPUB')
const dictionary = require('./cinnamon/dictionary')
const addArticle = require('./cinnamon/addArticle')
const sw = require('stopword')

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
        const blacklist = new Set(concat(
            fields.blacklist ? parseText(fields.source, fields.blacklist) : [],
            fields.stop ? sw[fields.source] : []
        ))
        const inputs = [
            fields.text,
            files.file.type == 'application/pdf',
            files.file.type == 'application/epub+zip',
            fields.url
        ].filter(i => i)

        if (inputs.length == 0) {
            return res.status(400).render('error', {
                message: 'Either submit a pdf, add text to be translated to the text field, or enter a url in the url field',
                error: {
                    status: 400,
                    stack: 'Submit something to be translated!'
                }
            })
        }
        const texts = []
        if (files.file.type == 'application/pdf') {
            try {
                const data = await fs.promises.readFile(files.file.path)
                const result = await pdf(data)
                texts.push(result.text)
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
        else if (files.file.type == 'application/epub+zip') {
            try {
                const text = await epubPathToText(files.file.path)
                texts.push(text)
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
            texts.push(fields.text)
        }
        if (fields.url) {
            try {
                const text = await parseWebsite(fields.url)
                if (text != null) {
                    texts.push(text)
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
        const words = parseText(fields.source, texts.filter(t => t).join('\n'))
        const wordsToTranslate = uniq(words).filter(word => !blacklist.has(word))

        const translationResult = await translate(wordsToTranslate, fields.source, fields.dest)
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
        if (fields.freq) {
            const counts = countWords(words.map(word => addArticle(fields.source, word)))
            translationResult.forEach(t => t.push(counts[t[0]]))
        }
        const csv = translationResult.map(r => r.join(',')).join('\n')
        
        return res.status(200)
            .attachment(`vocabulary.csv`)
            .send('\ufeff' + csv)
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
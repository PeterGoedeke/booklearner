// libraries used for pdf loading and processing
const formidable = require('formidable')
const fs = require('fs')
const pdf = require('pdf-parse')

const translate = require('./cinnamon')
const parseWebsite = require('./cinnamon/parseWebsite')
const { textToWords } = require('./cinnamon/parseText')

function translatePDF(req, res) {
    const form = formidable({ multiples: true })
    form.parse(req, async (err, fields, files) => {
        const validFields = new Set(['en', 'es', 'de'])
        if (!validFields.has(fields.source) || !validFields.has(fields.dest) || fields.source === fields.dest) {
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
        if (inputs.length > 1) {
            return res.status(400).render('error', {
                message: 'Only one submission method may be used simultaneously.',
                error: {
                    status: 400,
                    stack: 'Either submit a pdf, enter text, or enter a url.'
                }
            })
        }
        
        let words
        if (files.file.type == 'application/pdf') {
            try {
                const data = await fs.promises.readFile(files.file.path)
                const result = await pdf(data)
                words = textToWords(fields.source, result.text)
            }
            catch (e) {
                console.log(e)
            }
        }
        else if (fields.text) {
            words = textToWords(fields.source, fields.text)
        }
        else {
            try {
                const text = await parseWebsite(fields.url)
                words = textToWords(fields.source, text)
            }
            catch (e) {
                console.log(e)
            }
        }
        const translateWords = words.filter(word => !blacklist.has(word))

        const vocabulary = await translate(translateWords, fields.source, fields.dest)
        return res.status(200)
            .attachment(`vocabulary.csv`)
            .send(vocabulary)
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
    translatePDF
}
// libraries used for pdf loading and processing
const formidable = require('formidable')
const fs = require('fs');
const pdf = require('pdf-parse');

const translate = require('./cinnamon')
const parseWebsite = require('./cinnamon/parseWebsite')

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
        
        const test = parseWebsite(fields.url)


        if (fields.text && files.file.type == 'application/pdf') {
            return res.status(400).render('error', {
                message: 'Either fill out the text field or submit a pdf',
                error: {
                    status: 400,
                    stack: 'Cannot accept both text and pdf file.'
                }
            })
        }
        if (!fields.text && !files.file) {
            return res.status(400).render('error', {
                message: 'Either add text to be translated to the text field or submit a pdf',
                error: {
                    status: 400,
                    stack: 'Submit something to be translated!'
                }
            })
        }

        if (fields.text) {
            const vocabulary = await translate(fields.text, fields.source, fields.dest)
            return res.status(200)
                    .attachment(`vocabulary.csv`)
                    .send(vocabulary)
        }
        else {
            const toTranslate = files.file
            if (!toTranslate || toTranslate.type != 'application/pdf') {
                return res.status(400).render('error', {
                    message: 'Either no file was submitted or the format of the submitted file was not supported.',
                    error: {
                        status: 400,
                        stack: 'Supported file types right now are limited to pdf files.'
                    }
                })
            }
    
            fs.readFile(toTranslate.path, async (err, data) => {
                try {
                    const result = await pdf(data)
                    const vocabulary = await translate(result.text, fields.source, fields.dest)
                    return res.status(200)
                        .attachment(`vocabulary.csv`)
                        .send(vocabulary)
                }
                catch (e) {
                    console.log(e);
                }
            });
        }

    })
}


module.exports = {
    translatePDF
}
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
        
        let vocabulary
        if (files.file.type == 'application/pdf') {
            fs.readFile(toTranslate.path, async (err, data) => {
                try {
                    const result = await pdf(data)
                    vocabulary = await translate(result.text, fields.source, fields.dest)
                }
                catch (e) {
                    console.log(e);
                }
            });
        }
        else if (fields.text) {
            vocabulary = await translate(fields.text, fields.source, fields.dest)
        }
        else {
            const text = parseWebsite(fields.url)
            vocabulary = await translate(text, fields.source, fields.dest)
        }
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
// libraries used for pdf loading and processing
const formidable = require('formidable')
const fs = require('fs');
const pdf = require('pdf-parse');

const translate = require('./cinnamon')

function translatePDF(req, res) {
    const form = formidable({ multiples: true })
    form.parse(req, async (err, fields, files) => {
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
    })
}


module.exports = {
    translatePDF
}
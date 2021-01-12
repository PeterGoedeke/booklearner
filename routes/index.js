const router = require('express').Router()
const controller = require('../controllers/index')
const formidable = require('formidable')

const { tstrs } = require('../quizlet')

const fs = require('fs');
const pdf = require('pdf-parse');

// router.get('/words/:list', controller.getWords)
router.get('/mycsv', (req, res) => {
    res.status(200)
        .attachment(`test.csv`)
        .send('one,two\nthree,four')
})
router.get('/', (req, res) => {
    res.render('index', {})
})

// const fs = require('fs');
// const pdf = require('pdf-parse');
 
// let dataBuffer = fs.readFileSync('./pdf.pdf');
 
// pdf(dataBuffer).then(function(data) {
//     console.log(tstrs(data.text.substring(1000, 3000)));
// });

router.post('/submitpdf', (req, res) => {
    new formidable.IncomingForm().parse(req)
        .on('field', (name, field) => {
            console.log('Field', name, field)
        })
        .on('fileBegin', async (name, file) => {
            file.path = __dirname + '/uploads/' + file.name
        })
        .on('file', (name, file) => {
            console.log('Uploaded file')
            fs.readFile(file.path, async (err, data) => {
                try {
                    const result = await pdf(data)
                    const things = await tstrs(result.text)
                    res.status(200)
                        .attachment(`test.csv`)
                        .send(things)
                }
                catch (e) {
                    console.log(e);
                }
    
            });
        })
        .on('aborted', () => {
            console.error('Request aborted by the user')
        })
        .on('error', (err) => {
            console.error('Error', err)
            throw err
        })
        .on('end', () => {
        })
})

module.exports = router
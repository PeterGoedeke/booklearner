const router = require('express').Router()
const controller = require('../controllers/index')
const dictionary = require('../controllers/cinnamon/dictionary')

const supportedLanguages = Object.getOwnPropertyNames(dictionary)

router.get('/', (req, res) => {
    res.render('index', { supportedLanguages: supportedLanguages })
})

router.post('/submit', controller.translate)

module.exports = router
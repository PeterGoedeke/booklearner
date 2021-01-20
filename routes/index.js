const router = require('express').Router()
const controller = require('../controllers/index')

router.get('/', (req, res) => {
    res.render('index', {})
})

router.post('/submit', controller.translate)

module.exports = router
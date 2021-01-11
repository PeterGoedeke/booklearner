const router = require('express').Router()
const controller = require('../controllers/index')

router.get('/words/:list', controller.getWords)

module.exports = router
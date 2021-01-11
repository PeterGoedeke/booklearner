const mongoose = require('mongoose')
const LinkResponseSchema = new mongoose.Schema({

}, { strict: false })
mongoose.model('LinkResponse', LinkResponseSchema)
const mongoose = require('mongoose')
const ApiResponseSchema = new mongoose.Schema({

}, { strict: false })
mongoose.model('ApiResponse', ApiResponseSchema)
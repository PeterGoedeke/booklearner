const mongoose = require('mongoose')

const WordSchema = new mongoose.Schema({
    english: {
        type: String,
        required: true
    },
    german: {
        type: String,
        required: true
    },
    ready: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 0
    },
    list: {
        type: String,
        default: 'global'
    }
})

mongoose.model('Word', WordSchema)
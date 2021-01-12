const mongoose = require('mongoose')

const WordSchema = new mongoose.Schema({
    source: {
        type: String,
        required: true
    },
    dest: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    translation: {
        type: String,
        required: true
    }
})

mongoose.model('Word', WordSchema)
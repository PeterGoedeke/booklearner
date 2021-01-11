const mongoose = require('mongoose')
const Word = mongoose.model('Word')
const validate = require('./validation')
const translate = require('./translate')
const dictionary = require('../dictionaries')
const { error, result } = require('./result')

const createFilter = lang => ({
    text: 1,
    source: 1,
    lang: 1,
    definition: 1,
    [`translations.${lang}`]: 1
})

async function encaseMongo(query) {
    try {
        const response = await query()
        if (!response) {
            return error(404, { missing: true })
        }
        return result(response)
    }
    catch (err) {
        console.log(err);
        return error(500, err)
    }
}

async function getWordFromRef(req, res) {
    const v = validate.asWordIdRequest(req.query)
    if (v.isError()) {
        return res.status(v.error.code).json(v.error.data)
    }
    const result = await encaseMongo(async () => await Word.findById(req.query.q, createFilter(req.query.dest)))
    if (result.isError()) {
        return res.status(result.error.code).json(result.error.data)
    }
    const validatedWord = await validateWord(result.data, result.data.text, result.data.source, req.query.dest)
    return res.status(200).json(validatedWord)
}

async function getWordsFromRefs(req, res) {
    const v = validate.asWordIdRequests(req.body)
    if (v.isError()) {
        return res.status(v.error.code).json(v.error.data)
    }
    const result = await encaseMongo(async () => await Word.find({ _id: { $in: req.body.q } }, createFilter(req.body.dest)))
    if (result.isError()) {
        return res.status(result.error.code).json(result.error.data)
    }
    if (req.body.q.length != result.data.length) {
        // TODO; handle this error
    }
    const validatedWords = await Promise.all(result.data.map(word => validateWord(word, word.text, word.source, req.body.dest)))
    return res.status(200).json(validatedWords)
}

async function validateWord(word, q, source, dest) {
    console.log('heyo!');
    if (!word) {
        try {
            const response = await translate.retrieve(q, source, dest)
            const newWord = new Word({
                text: q,
                source,
                translations: {
                    [dest]: response
                }
            })
            newWord.save()
            return newWord
        } catch (err) {
            // TODO; handle this error
        }
    }
    else if (!word.translations[dest]) {
        try {
            const response = await translate.retrieve(q, source, dest)
            word.updateOne({ $set: { [`translations.${dest}`]: response } }).exec()
            word.translations[dest] = response
        } catch (err) {
            // TODO; handle this error
        }
    }
    return word
}

async function getWordFromText(req, res) {
    const v = validate.asWordDictRequest(req.query)
    if (v.isError()) {
        return res.status(v.error.data).json(v.error.code)
    }
    const { q, source, dest } = req.query

    const result = await encaseMongo(async () => await Word.findOne({ text: q, source }, createFilter(dest)))
    if (result.isError() && result.error.data.missing || !result.isError()) {
        const validatedWord = await validateWord(result.data, q, source, dest)
        return res.status(200).json(validatedWord)
    }
    return res.status(result.error.code).json(result.error.data)
}

/**
 * Pls see if this works
 * @body
 */
async function getWordsFromTexts(req, res) {
    const v = validate.asWordDictRequests(req.body)
    if (v.isError()) {
        return res.status(v.error.code).json(v.error.data)
    }
    const { q, source, dest } = req.body
    const result = await encaseMongo(async () => Word.find({ text: { $in: q }, source }, createFilter(dest)))
    if (result.isError() && result.error.data.missing || !result.isError()) {
        const words = []
        for (let i = 0; i < q.length; i++) {
            words.push(validateWord(result.data[i], q[i], source, dest))
        }
        const validatedWords = await Promise.all(words)
        return res.status(200).json(validatedWords)
    }
    return res.status(result.error.code).json(result.error.data)
}

module.exports = {
    getWordFromRef,
    getWordFromText,
    getWordsFromTexts,
    getWordsFromRefs
}
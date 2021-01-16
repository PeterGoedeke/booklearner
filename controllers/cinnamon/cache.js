// library dependencies
const Word = require('mongoose').model('Word')
const { curryN } = require('ramda')

// dictionary dependencies
const addArticle = require('./addArticle')

const cacheParsedRequest = curryN(3, (source, dest, r) => {
    r.forEach(t => {
        const word = new Word({
            source,
            dest,
            text: t[0],
            translation: t[1]
        })
        word.save().catch(console.log)
    })
})

const getFromCache = curryN(3, async (source, dest, w) => {
    const response = await Word.findOne({ source, dest, text: addArticle.de(w) })
    return {
        word: w,
        result: response,
        wasCached: !!response
    }
})

module.exports = {
    cacheParsedRequest,
    getFromCache
}
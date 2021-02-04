/**
 * Cache words and retrieve words from the cache.
 */

// library dependencies
const Word = require('mongoose').model('Word')
const { curryN } = require('ramda')

// dictionary dependencies
const addArticle = require('./addArticle')

/**
 * Cache the result of a request to the api
 * @param {String} source the language the request is being translated from
 * @param {String} dest the language the request is being translated to
 * @param {String} r the api response to be cached
 */
const cacheParsedRequest = curryN(3, (source, dest, r) => {
    return Promise.all(
        r.map(t => {
            const word = new Word({
                source,
                dest,
                text: t[0],
                translation: t[1]
            })
            return word.save()
        }
    ))
})

/**
 * Retrieve a previously cached word
 * @param {String} source the language the request is being translated from
 * @param {String} dest the language the request is being translated to
 * @param {String} w the word to be retrieved from the cache
 */
const getFromCache = curryN(3, async (source, dest, w) => {
    const response = await Word.findOne({ source, dest, text: addArticle(source, w) })
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
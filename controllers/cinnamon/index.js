/**
 * Translate a list of words and generate a CSV as output.
 * Contains function for requesting translations from the api
 */

// library dependencies
const axios = require('axios')
const { partition, prop, curryN } = require('ramda')
const util = require('util')

// dependencies from project
const { wordsToQueries } = require('./parseText')
const { parseRequest, parsedRequestToCSV } = require('./parseRequest')
const { getFromCache, cacheParsedRequest } = require('./cache')

// mongoose dependencies
const mongoose = require('mongoose')
const ApiResponse = mongoose.model('ApiResponse')

/**
 * 
 * @param {String} words the words to be translated into a csv
 * @param {String} source the language the words are in
 * @param {String} dest the language the words are to be translated to
 */
const wordsToTranslations = async (words, source, dest) => {
    try {
        // retrieve from the words and filter those which are 'dead words' (i.e. gibberish phrases)
        const cacheResults = (await Promise.all(words.map(getFromCache(source, dest))))
            .filter(word => !word.wasCached || word.result.translation)

        const r = partitionCachedUncached(cacheResults)
        try {
            const responses = await Promise.all(r.uncachedAsQueries.map(
                (v, i) => makeRequest(i * 500, source, dest, v)
            ))
            const parsedResults = responses.map(parseRequest(source))

            parsedResults.forEach(cacheParsedRequest(source, dest))

            // remove the dead words from the words which were just parsed and combine to CSV
            const parsedResultsFormatted = parsedResults
                .map(l => l.filter(r => r[1]))
                .filter(l => l.length != 0)
                // .map(parsedRequestToCSV)
                // .join('\n')
            return parsedResultsFormatted.length != 0
                // ? parsedResultsAsCSV + '\n' + r.cached
                ? parsedResultsFormatted.concat(r.cached)
                : r.cached
        }
        catch (e) {
            console.log(e)
            // this error is likely because the api rejected the requests for some reason
            return {
                error: true,
                status: 502,
                type: 'gateway',
                message: e
            }
        }            
    }
    catch (e) {
        // something is probably wrong with the database if this error occurs
        console.log(e)
        return {
            error: true,
            status: 500,
            type: 'cache',
            message: e
        }
    }
}

/**
 * 
 * @param {*} cacheResults 
 */
const partitionCachedUncached = cacheResults => {
    const [cachedResult, uncached] = partition(r => r.wasCached, cacheResults)
    // const cachedAsCSV = cached.map(c => c.result.text + ',' + c.result.translation).join('\n')
    const cached = cachedResult.map(c => [c.result.text, c.result.translation])
    const uncachedAsQueries = wordsToQueries(uncached.map(prop('word')))
    
    return { cached, uncachedAsQueries }
}

;(async function() {
    // console.log('hello', await textToTranslations('gehen Gehen hund Hund', 'de', 'en'))
    // console.log(await textToTranslations('yeetyeet Hund hund', 'de', 'en'))
})()
const delay = util.promisify(setTimeout)

const makeRequest = curryN(4, async function (time, source, dest, q) {
    await delay(time)
    console.log(`Requesting word ${q} in ${source} to ${dest}`)
    const response = await axios.get(process.env.WEBIT_URL, {
        params: {
            q,
            from: source,
            to: dest,
            force_v2: true,
            webit_magic_keys: '7SV4RH1S0PWA4Z0U'
        },
        // required headers for rapidapi
        headers: {
            'x-rapidapi-host': 'webit-language.p.rapidapi.com',
            'x-rapidapi-key': process.env.WEBIT_API_KEY
        }
    })
    const apiResponse = new ApiResponse(response.data)
    apiResponse.save().catch(err => {
        console.log('api response save error')
        console.log(err)
        console.log(response.data)
        console.log(typeof response.data)
    })
    return response.data
})

module.exports = wordsToTranslations
/**
 * Translate a list of words and generate a CSV as output.
 * Contains function for requesting translations from the api
 */

// library dependencies
const axios = require('axios')
const { partition, prop, curryN } = require('ramda')
const util = require('util')
const io = global.io

// dependencies from project
const { wordsToQueries, countWords } = require('./parseText')
const { parseRequest } = require('./parseRequest')
const { getFromCache, cacheParsedRequest } = require('./cache')
const addArticle = require('./addArticle')

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
            const responses = await Promise.all(r.uncachedAsQueries.slice(0, 1).map(
                (v, i) => makeRequest(i * 500, source, dest, v)
            ))
            const parsedResults = responses.map(parseRequest(source))

            await Promise.all(parsedResults.map(cacheParsedRequest(source, dest)))

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

const translationQueue = (function() {
    const queue = []
    let active = false
    
    const run = async () => {
        if (queue.length == 0 || active) {
            return
        }
        console.log('starting a run...')
        active = true

        const [words, source, dest, counts, id] = queue.shift()

        const result = await wordsToTranslations(words, source, dest)
        if (result.error) {
            io.to(id).emit('error', JSON.stringify(result))
            active = false
            console.log('ending a run due to error...')
            return run()
        }
        if (counts) {
            result.forEach(t => t.push(counts[t[0]]))
        }
        const csv = '\ufeff' + result.map(r => r.join(',')).join('\n')

        io.to(id).emit('words', csv)
        active = false
        console.log('ending a run for legitimate reasons...')
        console.log(csv)

        queue.forEach((item, index) => io.to(item[4]).emit('queue', index + 1))

        return run()
    }
    return async (words, source, dest, counts, id) => {
        const cacheResults = (await Promise.all(words.map(getFromCache(source, dest))))
            .filter(word => !word.wasCached || word.result.translation)
        
        const result = partitionCachedUncached(cacheResults)
        if (result.cached.length == words.length) {
            if (counts) {
                result.cached.forEach(t => t.push(counts[t[0]]))
            }
            const csv = '\ufeff' + result.cached.map(r => r.join(',')).join('\n')
            io.to(id).emit('words', csv)
            return 0
        }

        queue.push([words, source, dest, freq, id])
        run()
        return queue.length
    }
})()

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

module.exports = translationQueue
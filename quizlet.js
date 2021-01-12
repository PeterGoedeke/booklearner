require('dotenv').config()
const axios = require('axios')

// need to account for when the dictionary has the word but the api does not

const { partition, is, splitEvery } = require('ramda')

const woerter = new Set(require('./woerter.json'))
const words = require('german-words')
const list = require('german-words-dict')

const mongoose = require('mongoose')
const Word = mongoose.model('Word')
const ApiResponse = mongoose.model('ApiResponse')

const addArticle = w => {
    try {
        const gender = words.getGenderGermanWord(null, list, w)
        if (gender == 'M') {
            return 'der ' + w
        }
        else if (gender == 'F') {
            return 'die ' + w
        }
        else {
            return 'das ' + w
        }
    }
    catch (e) {
        return w
    }
}

async function makeRequest(q) {
    console.log('making the request!', q)
    const response = await axios.get(process.env.WEBIT_URL, {
        params: {
            q,
            from: 'de',
            to: 'en'
        },
        // required headers for rapidapi
        headers: {
            'x-rapidapi-host': 'webit-language.p.rapidapi.com',
            'x-rapidapi-key': process.env.WEBIT_API_KEY
        }
    })
    const apiResponse = new ApiResponse(response.data)
    apiResponse.save().catch(console.log)

    return response.data
}

async function makeRequests(qs) {
    const responses = await Promise.all(qs.map(makeRequest))
    const results = responses.map(parser.run)
    return results.join('\n')
}

const qs = (function() {
const uniq = arr => Array.from(new Set(arr))

    const listwords = s =>
    uniq(
        s.split(/\s/)
        .map(w => w.replace(/[^a-z]/gi, ''))
        )
    .filter(w => woerter.has(w))
        
    // const split = a => {
    //     const rs = []
    //     let i = -1
    //     for (const word of a) {
    //         if (!rs[i] || rs[i].length + word.length + 1 > 1000) {
    //             rs[++i] = word
    //             // console.log(word);
    //         }
    //         else {
    //             rs[i] += ',' + word
    //         }
    //     }
    //     return rs
    // }
    const split = a => splitEvery(10, a).map(qs => qs.join(','))

    const thing = w => w.text + ',' + w.translation

    const run = async s => {
        const words = listwords(s)
        const results = await Promise.all(words.map(
            async word => {
                const response = await Word.findOne({ source: 'de', dest: 'en', text: addArticle(word) })
                return response == null ? word : response
            }
        ))
        const parts = partition(is(String), results)
        return [split(parts[0]), parts[1].map(thing).join('\n')]
            }
    return {
        run
        }
})()


const putTogether = async s => {
    const [qss, ws] = await qs.run(s)
    const rs = await makeRequests(qss)
    return rs + '\n' + ws
    }
    
;(async function() {
    // const final = await putTogether('sehen du ein zwei')
    // console.log('yeeeeeeeeeeeeeeeeeeeeee')
    // console.log(final)
    // console.log(strings)
    
    // const response = await makeRequests(strings)
    // console.log(response)


    // console.log(parser.run(await makeRequests(tstrs('ausmachen du hassen, Tier'))))
})()

const parser = (function() {
    // const parse = r => r.data
    //     .map(t => 
    //         addArticle(t.term)
    //         + ','
    //         + (t.translations.length == 1
    //             ? t.translations[0].translation
    //             : t.translations
    //                 .filter(e => e.confidence > 0.8)
    //                 .sort((a, b) => {
    //                     console.log(a.confidence, a.confidence,  isNaN(a.confidence))
    //                     return b.confidence - a.confidence
    //                 })
    //                 .map(e => e.translation).join(' | ')
    //     )).join('\n')
const parse = r => r.data
        .map(t => [
            addArticle(t.term),
            (t.translations.length == 1
            ? t.translations[0].translation
            : t.translations
                .filter(e => e.confidence > 0.8)
                    .sort((a, b) => b.confidence - a.confidence)
                    .map(e => e.translation).join(' | ')
            )]
        )
    
    const cache = rs => {
        rs.forEach(r => {
            const word = new Word({
                source: 'de',
                dest: 'en',
                text: r[0],
                translation: r[1]
            })
            word.save().catch(console.log)
                })
    }

    const tocsv = rs => rs.map(r => r.join(',')).join('\n')

    return {
        run: function(r) {
            if (r.data == null) {
                return ''
            }
            const parsed = parse(r)
            cache(parsed)
            return tocsv(parsed)
        }
    }
})()

module.exports = {
    tstrs: putTogether
}
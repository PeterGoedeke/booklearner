// library dependencies
const { splitEvery } = require('ramda')
const xregexp = require('xregexp')
const alphas = xregexp("[^\\s\\p{Latin}]+", "g");

// dictionaries
const dictionary = require('./dictionary')

const uniq = arr => Array.from(new Set(arr))

const textToWords = (source, s) =>
    uniq(
        s.replace(/\s\s+/g, ' ')
         .trim()
         .split(/\s/)
         .map(w => xregexp.replace(w, alphas, ""))
    )
    .filter(w => dictionary[source].has(source == 'de' ? w : w.toLowerCase()))

const wordsToQueries = ws => splitEvery(Number(process.env.WORDS_PER_QUERY), ws).map(te => te.join(','))

module.exports = {
    textToWords,
    wordsToQueries
}
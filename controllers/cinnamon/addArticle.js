/**
 * Add articles to nouns in languages which have the concept of gender
 */
const de = (function() {
    const words = require('german-words')
    const list = require('german-words-dict')

    const genders = { M: 'der', F: 'die', N: 'das' }

    /**
     * Add a german article to a word (e.g. Der, Die, or Das)
     * Adds the article for words which begin with a capital letter and are nouns, returns
     * the original word for words which do not match this description.
     * 
     * The German dictionary used contains only nouns which have capital letters, meaning that
     * nouns which are not capitalised will have already been filtered out earlier in the
     * process, so this is not a worry.
     * @param {String} w the word to have the article added
     */
    const addArticle = w => {
        try {
            return genders[words.getGenderGermanWord(null, list, w)] + ' ' + w
        }
        catch (e) {
            return w
        }
    }
    return addArticle
})()


module.exports = (source, word) => {
    if (source == 'de') return de(word)
    else return word
}
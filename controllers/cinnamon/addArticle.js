const de = (function() {
    const words = require('german-words')
    const list = require('german-words-dict')

    const genders = { M: 'der', F: 'die', N: 'das' }
    return w => {
        try {
            return genders[words.getGenderGermanWord(null, list, w)] + ' ' + w
        }
        catch (e) {
            return w
        }
    }
})()

module.exports = {
    de
}
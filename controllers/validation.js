const Joi = require('@hapi/joi')
const objectId = require('joi-objectid')(Joi)
const { result, error, ResultType } = require('./result')

/**
 * @param {*} schema 
 */
function validate(schema) {
    /**
     * @param {*} object 
     * @returns {ResultType}
     */
    const func = function(object) {
        const { err } = schema.validate(object)
        return err ? error(400, err) : result(true)
    }
    return func
}

const validateArray = schema => array => {
    if (!array || !Array.isArray(array)) {
        return error(400, { message: 'Is not an array.' })
    }
    const validator = validate(schema)

    for (const e of array) {
        const result = validator(e)

        if (result.isError()) {
            return result
        }
    }
    return result(array)
}

const wordSchema = Joi.object({
    text: Joi.string().required(),
    source: Joi.string().length(2).required(),
    dest: Joi.string().length(2).required(),
    translations: Joi.array().items(Joi.string()).required()
})

const idSchema = Joi.object({
    _id: objectId().required()
})

const wordIdRef = Joi.object({
    q: objectId().required(),
    dest: Joi.string().length(2).required()
})
const wordIdRefs = Joi.object({
    q: Joi.array().items(objectId()).required(),
    dest: Joi.string().length(2).required()
})

const wordDictRef = Joi.object({
    q: Joi.string().required(),
    source: Joi.string().length(2).required(),
    dest: Joi.string().length(2).required()
})
const wordDictRefs = Joi.object({
    q: Joi.array().items(Joi.string()).required(),
    source: Joi.string().length(2).required(),
    dest: Joi.string().length(2).required()
})

module.exports = {
    asWord: validate(wordSchema),
    asWordDictRequest: validate(wordDictRef),
    asWordDictRequests: validate(wordDictRefs),
    asWordIdRequest: validate(wordIdRef),
    asWordIdRequests: validate(wordIdRefs),
    asId: validate(idSchema)
}
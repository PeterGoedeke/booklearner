/**
 * Represents a result from a calculation. Roughly parallels the either monad
 * without being designed as a monad or being intended to be used in a functional style.
 */
class ResultType {
    /**
     * 
     * @param {ErrorP} error 
     * @param {*} data 
     */
    constructor(error, data) {
        this.error = error
        this.data = data
    }
    isError() {
        return !!this.error
    }
}
class ErrorP {
    constructor(data, code) {
        this.data = data
        this.code = code
    }
}

/**
 * 
 * @param {*} err 
 * @returns {ResultType}
 */
function error(code, err) {
    const result = new ResultType(new ErrorP(err, code), undefined)
    return result
}
/**
 * 
 * @param {*} data 
 * @returns {ResultType}
 */
function result(data) {
    const result = new ResultType(undefined, data)
    return result
}
module.exports = {
    error,
    result,
    ResultType,
    ErrorP
}
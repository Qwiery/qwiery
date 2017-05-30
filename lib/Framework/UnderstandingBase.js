/**
 * Base class for understanding types of information (dates, addresses...).
 * @class UnderstandingBase
 */
class UnderstandingBase {

    /**
     * Attempts to make sense of the given input
     * returning one or more objects which are of the type
     * the parsing class focuses on.
     * @param input {String} Anything really.
     * @virtual
     */
    parse(input){
        return null;
    }

    /**
     * Returns a natural language form of the given object
     * this parsing class focuses on.
     * @param obj
     * @virtual
     */
    unparse(obj){
        return null;
    }

    /**
     * Returns `true` if the given input can be understood as the type this class
     * focuses on.
     * @param intput {String} Anything really.
     * @virtual
     */
    isValid(intput){
        return false;
    }

}

module.exports = UnderstandingBase;
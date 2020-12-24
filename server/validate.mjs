//List of funciton used to in adding formatting rules for incoming contact data
const validationFunctions = {
    //Checks that data isn't null or empty
    checkRequired: (val, options) =>{
        try{
            var fieldName = options.fieldName;
            if(!fieldName){throw "missing field name for \"checkRequired\" function validation"}
            if(!val){ return new validationResult(false, `${fieldName} is required`)}
            if(val.length == 0){ return new validationResult(false, `${fieldName} is required`) }
            return new validationResult(true);
        }catch(err){
            console.log(err);
            return new validationResult(true);
        }
    },
    //Checks that data length is inbetween options.min and options.max in length
    checkLength: (val, options) => {
        var min = options.min;
        var max = options.max;
        var fieldName = options.fieldName;
        if(!val){return new validationResult(true)}
        if(min){if(val.length <= min){return new validationResult(false, `${fieldName} must be at least ${min} characters long`)}}
        if(max){if(val.length >= max){return new validationResult(false, `${fieldName} must be shorter than ${max} characters long`)}}
        return new validationResult(true);
    },
    //Special function for validating address -> If one address field is given, all 4 must be present
    validateAddress: (val, options) => {
        //check if address fields have values first. If null, don't validate address
        if(!val.street && !val.city && !val.state && !val.zip){
            return new validationResult(true);
        }
        //If some address fields, but not all are present, ask for all
        if(!val.street || !val.city || !val.state || !val.zip){
            return new validationResult(false, "Please provide a street, city, state, and zip code");
        }else{
            return new validationResult(true);
        }
        //TODO: use library to check address is valid
    },
    //Ensures a format of A@B.C for email
    validateEmail: (email, options)=>{
        if(!email){return new validationResult(true)}
        if(email.length < 5 || !(email.indexOf("@") > 0 && email.indexOf(".") > 0 && email.indexOf("@") < email.indexOf("."))){
            return new validationResult(false, "Email invalid");
        }else{
            return new validationResult(true);
        }
    },
    //Ensures that if there's an object pair (phone/type), both exist and not just one
    //Ensures that phone contains 10 characters (not necessarily numeric) as a sample rule
    //Ensures that types provided are in the list configued in Rule's options (according to requirements)
    validatePhone: (phoneArr, options)=>{
        var types = options.types;
        if(phoneArr.length == 0){return new validationResult(true);}

        var result = new validationResult(true);

        for(let i = 0; i < phoneArr.length; i++){
            var phoneObj = phoneArr[i];
            if(!phoneObj.number){ result  = new validationResult(false, "Missing phone number value"); break; }
            if(phoneObj.number.length != 10){ result = new validationResult(false, "Please use 10 digit number"); break }
            if(types.indexOf(phoneObj.type) == -1 || !phoneObj.type)
            { 
                result =  new validationResult(false, `Phone number: ${phoneObj.number} set to invalid type.
                Please use one of the following: ${types}`);
                break
            }
        }
        return result;
    }
}

//Each rule contains an array of field names (using dot notation for nested attributes), a rule object containing a function to run
//and the options to run in that function, and the name of the rule for easy identification if something goes wrong with the rule 
//Note: try catch in validate function will log name of rule where error originated
class Rule{
    constructor(fields, rule, ruleName){
        this.fields = fields;
        this.rule = {
            fn: rule.fn,
            options: rule.options
        };
        this.rule.options.fieldName = "";
        this.fieldName = "";
        this.ruleName = (ruleName || "");
    }
}

//List of rules that the contact's validate function will run through 
const valdiationRules = [
    new Rule(
        ["name.first"],
        {fn: validationFunctions.checkRequired, options:{}},
        //Name
        "Required"

    ),
    new Rule( 
        ["name.middle", "name.last"],
        {fn: validationFunctions.checkLength, options:{min:0, max:25}},
        //Name
        "Min/Max"

    ),
    new Rule(
        ["address"],
        {fn: validationFunctions.validateAddress, options: {}},
        //Name
        "Address Format"
    ),
    new Rule(
        ["email"],
        {fn: validationFunctions.validateEmail, options: {}},
        //Name
        "Email Format"
    ),
    new Rule(
        ["phone"],
        {fn: validationFunctions.validatePhone, options: {types:["home", "work", "mobile"]}},
        //Name
        "Phone Format"
    )
]

//I wanted a standatdized way to confirm that contact data passes an active rule's test
//The message serves as a way to communicate to the user what they need to fix in the data
class validationResult {
    constructor(success, msg){
        this.msg = msg;
        this.success = success;
    }
}

//Contact class is used to "serialize" json post req data
//TODO: Escape values going into Contact object.. not SQL vulnerabilities given doc based, but be aware of how data may be used 
//if other potentially sql based systems were integrated or used by this API
class Contact {
    constructor(obj){
        if(!obj.name){obj.name = {}}
        this.name = {
            first: (this.formatToString(obj.name.first) || null),
            middle: (this.formatToString(obj.name.middle) || null),
            last: (this.formatToString(obj.name.last) || null),
        }
        if(!obj.address){obj.address = {}}
        this.address = {
            street: (this.formatToString(obj.address.street) || null),
            city: (this.formatToString(obj.address.city) || null),
            state: (this.formatToString(obj.address.state) || null),
            zip: (this.formatToString(obj.address.zip) || null),
        }
        this.phone = (parsePhoneNumbers(obj.phone) || []);
        this.email = (this.formatToString(obj.email) || null);
    }
    //Gets attribute given a string attribute name using dot notation (ex. "first.name")
    getFieldFromPath(obj, path){
        if(path.indexOf(".") == -1){return obj[path]}
        var keys = path.split(".");
        var val = obj;
        keys.forEach((key)=>{
            try{
                val = val[key];
            }catch(err){
                val = null;
            }
        })
        return val;
    }
    //Ensures all non object or array attributes are strings
    formatToString(field){
        if(!field){return field}
        if(field.toString && typeof field != 'string'){field = field.toString();}
        field = field.replace(/[^a-zA-Z0-9@. ]/g, "");
        return field;
    }
    //This function kicks off applying the defined rules
        //For put requests, rules are ignored if the field isn't provided since entire contact schema isn't necessary
    validate(type){
        var errors = [];
        //Run any format checks on any values
        //cycle through validaiton rules
        valdiationRules.forEach((ruleSet)=>{
            var fields = ruleSet.fields;
            //apply the rule to each field in the fields array
            try{
                fields.forEach((field)=>{
                
                    //get the field's value
                    var val = this.getFieldFromPath(this, field);

                    //in validating an update, only validate the fields that exist
                    if(!val && type == "put"){return}

                    //run value through rule check
                    var rule = ruleSet.rule;
                    rule.options.fieldName = field;
                    var result = rule.fn(val, rule.options);
                    //if field value doesn't pass the check, add the error msg to the error array
                    try{
                        if(!result.success){errors.push(result.msg)}    
                    }catch(err){
                        if(!(result instanceof validationResult)){
                            //Identify rule that may have caused error
                            console.log(`Err: Rule ${rule.fn.name} failed to return a validationResult obj: data not validated`);
                            throw (err)
                        }
                    }
                })
            }catch(err){
                //Identify rule that may have caused error
                var ruleName = ruleSet.ruleName;
                if(!(fields instanceof Array)){console.log(`Err: Array of fields missing in Rule: ${ruleName}`)}
                if(ruleName){console.log(`Err: Check in ${ruleName}`)}
            }
        })
        return errors;
    }
}

//Phone numbers are an array of objects. This parses them given the expected {number: <stirng>, type: <string>} format
function parsePhoneNumbers(numbers){
    if(!(numbers instanceof Array)){return []}
    var parsedNumbers = [];
    numbers.forEach((num)=>{
        if(!num.number){num.number = "N/A"};
        if(!num.type){num.type = "N/A"};
        var parsed = {number: num.number.toString(), type: (num.type).toString().toLowerCase()}
        parsedNumbers.push(parsed);
    });
    return parsedNumbers;
}
//Validate contact for post requests (adding new contacts)
function validateContact(data){
    var contact = new Contact(data);
    var errors = contact.validate();
    return {contact: contact, errors: errors}
}

//Validates contact for put requests (updating existing contacts)
function validateUpdate(data){
    var update = new Contact(data);
    var errors = update.validate("put");
    return {update: update, errors: errors}
}

function validateId(id){
    try{
        id = id.toString();
        //Or use your favorite escaping library
        id = id.replace(/[^a-zA-Z0-9 ]/g, "");
        return {success:true, id: id}
    }catch(err){
        return {success: false, msg: "ID must be string"}
    }
}
export {validateContact, validateUpdate, validateId};
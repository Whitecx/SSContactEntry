import NeDB from 'nedb';
import Cursor from './node_modules/nedb/lib/cursor.js';
import util from 'util';
//Load database file stored in path
var db = new NeDB({filename: './data/contacts', autoload: true});

const insert = util.promisify((db.insert).bind(db));
const find = util.promisify((db.find).bind(db));
const update = util.promisify((db.update).bind(db));
const remove = util.promisify((db.remove).bind(db));
//Allows queries w/ sort to return promises
Cursor.prototype.asyncExec = util.promisify((Cursor.prototype.exec));

//Used as standardized result for DB queries. The endpoints expect this output for accessing DB Query success
class dbResult{
    constructor(sucess, results){
        //boolean value representing success of db query
        this.success = sucess;
        //result of db query (or error if success is false)
        this.results = results;
    }
}

//Functions
//General error handler
function handleError(err){
    console.log(err);
    return new dbResult(false, err);
}

//Get All Contacts
async function getAllContacts(){
    
    try{
        var res = await find({})
        return new dbResult(true, res);
    }catch(err){
        handleError(err);
    }
}

//Get Contacts by Id
async function getContact(id){
    try{;
        var res = await find({_id: id})
        return new dbResult(true, res);
    }catch(err){
        handleError(err);
    }
}

//Add New Contact
async function addContact(contact){
    try{
        var res = await insert(contact);
        return new dbResult(true, res);
    }catch(err){
        handleError(err);
    }
}

//Update Existing Contact
async function updateContact(id, contactUpdate){
    try{
        var res = await update({_id: id}, contactUpdate);
        return new dbResult(true, res);
    }catch(err){
        handleError(err);
    }
}

//Delete Existing Contact
async function deleteContact(id){
    try{
        var res = await remove({_id: id});
        return {success: true, results: res};
    }catch(err){
        handleError(err);
    }
}

//Call List
async function getCallList(){
    try{
        var res = await db.find({}, {name: 1, "phone.number": 1, _id: 0}).sort({'name.last': 1, 'name.first': 1}).asyncExec();
        var res = res.map((data)=>{
            var newData = {
                name:{first: data.name.first, middle: data.name.middle, last: data.name.last},
                phone: "",
            }
            console.log(data);
            if(data.phone){
                if(data.phone.number && data.phone.number[0]){newData.phone = data.phone.number[0]}
            }
            return newData
        })
        return new dbResult(true, res);
    }catch(err){
        handleError(err);
    }
}

export {getAllContacts, addContact, updateContact, getContact, deleteContact, getCallList};
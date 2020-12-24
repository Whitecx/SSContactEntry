import express from 'express';
import bodyParser from 'body-parser';

var app = express();
app.use(bodyParser.json());

//Normally used so local and production testing is easier to jump between
const port = (process.env.PORT || 5000);
app.listen(port);
console.log(`Server listening on port: ${port}`);

//General error handler
function serverError(err, res){
    //Log error and return 500 to client
    console.log(err);
    res.status(500).send({errors:[{msg:"An error has occured. Please try again later"}]});
}

//import functions
    //DB Functions
    import {getAllContacts, addContact, updateContact, getContact, deleteContact, getCallList} from './db.mjs';
    //Data validation functions (for contacts and contact updates)
    import {validateContact, validateUpdate, validateId} from './validate.mjs';

//Get Call List
app.get("/contacts/call-list", async(req, res)=>{
    //get all contacts sorted by last name, then first name
    //only retrieve name and phone attributes
    var results = await getCallList();
    if(!results.success){
        res.status(500).send({msg:"There was an issue retrieving the call list"});
    }else{
        res.send(results.results);
    }
})

//Get all contacts
app.get('/contacts', async (req, res)=>{
    var contacts = await getAllContacts();
    if(!contacts.success){
        res.status(500).send({msg:"There was an error retrieving the data!"});
        return
    }
    res.send(contacts.results);
});

//Get contact by Id
app.get('/contacts/:id', async (req, res)=>{
    var id = validateId(req.params.id);
    if(!id.success){ res.status(400).send({msg: id.msg})}
    id = id.id;
    console.log(id);

    var contacts = await getContact(id);
    if(!contacts.success){
        res.status(500).send({msg:"There was an error retrieving the data!"});
        return
    }
    console.log("DONE!!");
    res.send(contacts.results);
});

//Create new contact
app.post("/contacts", async (req, res)=>{
    try{
        //VALIDATION
        var data = validateContact(req.body);
        //If there are errors, let the API user know
        if(data.errors.length > 0){ res.status(400).send({errors: data.errors}); return }
        var newContact = data.contact;   

        //INSERT DATA
        var results = await addContact(newContact);
        if(!results.success){
            res.status(400).send({msg: "There was a problem saving the contact!"});
        }else{
            res.send({msg: "Contact added!"});
        }
    }catch(err){
        serverError(err, res);
    }
});

//Update contact given Id
app.put("/contacts/:id", async (req, res)=>{
    var id = validateId(req.params.id);
    if(!id.success){ res.status(400).send({msg: id.msg})}
    id = id.id;
    //create contact from payload
    var data = await validateUpdate(req.body);

    if(data.errors.length > 0){ res.status(400).send({errors: data.errors}); return }
    
    var update = data.update;
    //execute update
    var results = await updateContact(id, update);
    if(!results.success){
        //TODO add more descriptive message
        res.status(400).send({msg: "There was a problem updating the contact!"});
    }else{
        res.send({msg: "Contact Updated!"});
    }
    
})

//Delete contact given Id
app.delete("/contacts/:id", async(req, res)=>{
    var id = validateId(req.params.id);
    if(!id.success){ res.status(400).send({msg: id.msg})}
    id = id.id;
    //delete the contact w/ id <id>
    var results = await deleteContact(id);
    if(!results.success){
        res.status(400).send({msg: "There was a problem deleting this contact"});
    }else if(results.results < 1){
        res.send({msg: "No contact found w/ id supplied"});
    }else{
        res.send({msg: "Contact removed!"});
    }
});
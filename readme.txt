Startup Instructions:
1. Clone Repo
2. run npm install
3. Start w/ npm Start

Code Implementation Notes:
- Dependencies
Uses NeDB for data storage and express. I tend to use mjs (note --experimental-modules flag), primarily because I like the
cleaner "import" "export" syntax.

- Contains CRUD HTTP methods according to requirements

- WebAPI Considerations:
Unlike a web applicaiton, since there was no UI for me to design, I tried to make the web api as forgiving as possible.
Update actions don't require a payload that completely models the contact schema. In both creation and updates, the API 
serializes the payload against a contact object definition.

- Formatting
To impose any restrictions or rules on how data should be formatted, there are a set of Rule objects that define rules to apply to a given
array of fields. These rule functions will populate an errors array if there are any formatting errors and notify the sender what needs to be 
changed by returning a "validationResult" object. This design allows for easily changing which rules apply to which fields without 
significant/tedious changes to the overall source code. By supplying a path to the field in question (Ex. "name.first"), a parsing 
funciton retrieves the proper attributes from the contact object. 

There weren't too many details on how data should be formatted, so I added a few simple rules in hopes that the overall setup for
adding new rules would make for decent customizability. The validate.mjs was the least simple to implement, and I'd consider a 
simpler implementation might be better and easier to pick up.

- Database functions
Like the enpoints, w/ DB functions I like to stick w/ async/await as much as possible to keep the code clean and easy to read
and debug. The NeDB library only supports callbacks, so I used promisify to keep the async/await pattern. Because the libraries
method for sorting requires using a function from the Cursor object created from the db.find function on demand, I needed to import 
the Cursor and promisify a new version of it's exec to use async/await for any sorted queries throughout the codebase with as little 
hassle as possible. Initally, I modifed the original exec function defined in the prototype, but this caused problems in the other 
functions due to underlying dependencies. I typically use a server based database, but NeDB made for quicker implementation (as 
suggested)

I'm more familiar w/ SQL vulnerabilities, so I did a bit of reading on NoSQL injection vulnerabilities. The less dynamic nature of
the queries done in the PUT, GET, and POST requests in this API are seemingly more resistent to this type of attack (granted there's no 
auth mechanism to subvert in this project). Nevertheless, given the ability to inject code into and control a DB, there's still 
very significant reason to ensure injection is unlikely, so special character are removed from data "after" the data has been processed
as JSON (JSON parsing happens through the body parser middle ware). This prevents the risk of escaping prior to JSON reading encoded 
characters, and potentially allowing for supposedly escaped characters to pass through unintentionally.

- Unit Tests
I've actually no formal experience using unit tests. I was going to use mocha (notice it is in the package.json file, as well as a
/tests directory) after looking into it. After reading more about them, I see how they would've been very helpful in this sample app 
w/ quickly confirming that any previously tested code wasn't broken after a code change, but for sake of time I ended up not 
inclduing them given my limited experience. I'm definitely going to try them out in the near future 

- Misc
Initially, I was going to add a bit more scaffolding to make running it in a cloud server or produciton environment more feasible
by adding dotenv loading environment variables, but I assumed that would be overkill/out-of-scope given the intentions of the exercise
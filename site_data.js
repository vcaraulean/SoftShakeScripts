var GoogleSpreadsheet = require("google-spreadsheet");
var credentials = require("./credentials.json");
var fs = require("fs");
var path = require("path");

var mkDirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
}

function writeToFile(fileName, data){
    mkDirSync(".test")
    var localFolder = ".test/_data";
    mkDirSync(localFolder);
    fs.writeFile(path.join(localFolder, fileName), JSON.stringify(data, null, 2), function(err){
        if (err) throw err;
    });
}


// TODO:
// - pull rows
// - filter on Selected column
// - pull data
// - write to local folder json files

var simpleObj = {
    property1: "something",
    property2: "else",
    propertyInt: 1234
};

writeToFile("sample_data.json", simpleObj);

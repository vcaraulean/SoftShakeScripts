var fs = require("fs");
var path = require("path");
var common = require("./common.js")
var gSpreadsheet = require("./gSpreadsheet");

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

function createDataRecord(spreadsheetRow){
    var record = {
        speakerName: "{0} {1}".format(spreadsheetRow.prénom, spreadsheetRow.nom),
        speakerEmail: spreadsheetRow.email,
        speakerBio: spreadsheetRow.biographie,
        speakerAddress: spreadsheetRow.villepays,
        speakerTitle: spreadsheetRow.professiontitre,
        speakerOrganization: spreadsheetRow.organisation,
        sessionTitle: spreadsheetRow.titre,
        sessionDescription: spreadsheetRow.description,
        sessionCategory: spreadsheetRow.catégorie,
        sessionLevel: spreadsheetRow.niveaux,
        sessionTopic: spreadsheetRow.thème,
        sessionTags: [spreadsheetRow.track],
        scheduleDay: 1,
        scheduleOrder: 1
    };
    return record;
}

function processAllRows(rows){
    var records = [];

    for(var i = 0; i < rows.length; i++){
        records.push(createDataRecord(rows[i]));
    }

    writeToFile("sessions.json", records);
}

gSpreadsheet.processRow(processAllRows);

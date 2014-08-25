var fs = require("fs");
var path = require("path");
var common = require("./common.js")
var gSpreadsheet = require("./gSpreadsheet");
var yaml = require("yamljs");

var mkDirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
}

function getPathForFile(name){
    mkDirSync(".test")
    var localFolder = ".test/_data";
    mkDirSync(localFolder);
    mkDirSync(localFolder + "/_sessions");

    return path.join(".test/_data", name);
}

function writeToFile(fileName, data){
    var filePath = getPathForFile(fileName);
    fs.writeFile(filePath, JSON.stringify(data, null, 2), function(err){
        if (err) throw err;
        console.log("File written to: " + filePath);
    });
}

function anyStringToFileName(input) {
    var name = input.replace(/[^a-z0-9\u00C0-\u017F]/gi, '-').toLowerCase();
    return name + ".md";
}

function createSessionFile(spreadsheetRow){
    var scheduleParts = spreadsheetRow.schedule.split("/");
    var record = {
        layout: "2014_default_en",
        speakerName: "{0} {1}".format(spreadsheetRow.prénom, spreadsheetRow.nom),
        sessionTitle: spreadsheetRow.titre,
        speakerEmail: spreadsheetRow.email,
        speakerBio: spreadsheetRow.biographie,
        speakerAddress: spreadsheetRow.villepays,
        speakerTitle: spreadsheetRow.professiontitre,
        speakerOrganization: spreadsheetRow.organisation,
        sessionCategory: spreadsheetRow.catégorie,
        sessionLevel: spreadsheetRow.niveaux,
        sessionTopic: spreadsheetRow.thème,
        sessionTags: [spreadsheetRow.track],
        scheduleDay: scheduleParts[0],
        scheduleOrder: scheduleParts[1]
    };

    var header = yaml.stringify(record, 4);

    var fileName = anyStringToFileName(spreadsheetRow.titre);
    var filePath = getPathForFile("_sessions/" + fileName);
    fs.writeFileSync(filePath, "---\n")

    fs.appendFileSync(filePath, header + "---\n\n");
    fs.appendFileSync(filePath, spreadsheetRow.description + "\n");
    return fileName;
}

function createProgramRecord(spreadsheetRow, sessionFile){
    var scheduleParts = spreadsheetRow.schedule.split("/");
    var record = {
        speakerName: "{0} {1}".format(spreadsheetRow.prénom, spreadsheetRow.nom),
        sessionTitle: spreadsheetRow.titre,
        sessionTags: [spreadsheetRow.track],
        scheduleDay: scheduleParts[0],
        scheduleOrder: scheduleParts[1],
        sessionFileName: sessionFile
    };
    return record;
}

function processAllRows(rows){
    var records = [];

    for(var i = 0; i < rows.length; i++){
        var row = rows[i];
        if (row.isselected == "1"){
            var sessionFile = createSessionFile(row);
            records.push(createProgramRecord(row, sessionFile));
        }
    }

    writeToFile("program.json", records);

    console.log("Exported {0} selected talks".format(records.length));
}

gSpreadsheet.processRow(processAllRows);

var fs = require("fs");
var path = require("path");
var common = require("./common.js");
var gSpreadsheet = require("./gSpreadsheet");
var yaml = require("yamljs");
var gravatar = require("gravatar");
var diacritics = require("diacritics");

var mkDirSync = function (path) {
    try {
        fs.mkdirSync(path);
    } catch(e) {
        if ( e.code != 'EEXIST' ) throw e;
    }
};

function getPathForFile(name){
    mkDirSync(".export");
    var localFolder = ".export/_exported_sessions";
    mkDirSync(localFolder);

    return path.join(".export/_exported_sessions", name);
}

function writeToFile(fileName, data){
    var filePath = getPathForFile(fileName);
    fs.writeFile(filePath, JSON.stringify(data, null, 2), function(err){
        if (err) throw err;
        console.log("File written to: " + filePath);
    });
}

function anyStringToFileName(input) {
    var noDiacritics = diacritics.remove(input);
    var lowerCased = noDiacritics.replace(/[^a-z0-9\u00C0-\u017F]/gi, '-').toLowerCase();

    var finalName = [];
    for (var i = 0; i < lowerCased.length; i++){
        // strip first or last '-' in name
        if((i == 0 || i == lowerCased.length - 1) && lowerCased[i] == '-'){
            continue;
        }
        // stripping multiple '-' in a row, taking only one
        if (lowerCased[i] == '-' && lowerCased[i+1] == '-' ){
            continue;
        }
        finalName.push(lowerCased[i]);
    }

    return finalName.join('');
}

function createSessionFile(spreadsheetRow){
    var record = {
        layout: "2014_session",
        speakerName: "{0} {1}".format(spreadsheetRow.prénom, spreadsheetRow.nom),
        sessionTitle: spreadsheetRow.titre,
        speakerEmail: spreadsheetRow.email,
        speakerBio: spreadsheetRow.biographie,
        speakerAddress: spreadsheetRow.villepays,
        speakerTitle: spreadsheetRow.professiontitre,
        speakerOrganization: spreadsheetRow.organisation,
        speakerAvatarUrl: gravatar.url(spreadsheetRow.email, {size: 200, default: "mm"}),
        sessionCategory: spreadsheetRow.catégorie,
        sessionLevel: spreadsheetRow.niveaux,
        sessionTopic: spreadsheetRow.thème,
        sessionTags: [spreadsheetRow.track]
    };

    record = addSchedule(record, spreadsheetRow.schedule);

    var header = yaml.stringify(record, 4);

    var fileName = anyStringToFileName(spreadsheetRow.titre);
    var filePath = getPathForFile(fileName + ".md");
    fs.writeFileSync(filePath, "---\n");

    fs.appendFileSync(filePath, header + "---\n\n");
    fs.appendFileSync(filePath, spreadsheetRow.description + "\n");
    return fileName;
}

function addSchedule(record, scheduleValue){
    var scheduleParts = scheduleValue.split("/");
    var day = scheduleParts[0],
        order = scheduleParts[1],
        room = scheduleParts[2];
    if (scheduleParts[0] === undefined || scheduleParts[0] == "") {
        day = "?";
    }
    if (scheduleParts[1] === undefined) {
        order = "?";
    }
    if (scheduleParts[2] === undefined) {
        room = "?";
    }

    record.scheduleDay = day;
    record.scheduleOrder = order;
    record.scheduleRoom = room;
    return record;
}

function processAllRows(rows){
    var rowsExported = 0;
    for(var i = 0; i < rows.length; i++){
        var row = rows[i];
        if (row.isselected == "1"){
            createSessionFile(row);
            rowsExported++;
        }
    }
    console.log("Exported {0} selected talks".format(rowsExported));
}

gSpreadsheet.processRow(processAllRows);

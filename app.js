var GoogleSpreadsheet = require("google-spreadsheet");
var credentials = require("./credentials.json");
var Trello = require("node-trello");

var trello = new Trello(credentials.trelloApiKey, credentials.trelloToken);

String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

function getSpreadsheetRows(processOneRow) {
    var speakerSheet = new GoogleSpreadsheet("1CTRSexIlUTCYTsPY2-pKLeOmCnaBtC0lKZLutVQoGJ8");

    speakerSheet.setAuth(credentials.googleLogin, credentials.googlePassword, function (err) {
        if (err) {
            console.log(err);
            return;
        }

        speakerSheet.getInfo(function (err1, sheetInfo) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(sheetInfo.title + " is loaded");

            speakerSheet.getRows(1, function (err2, rowData) {
                console.log("Pulled in " + rowData.length + " rows ");

                for (var i = 0; i < rowData.length; i++) {
                    processOneRow(rowData[i]);
                }
            });
        });
    });
}

function processRow(row) {
    console.log("Processing: [" + row.prénom + " " + row.nom + "] " + row.titre);
}

//getSpreadsheetRows(processRow);

function archiveAllCards(listId)
{
    trello.post("/1/lists/{0}/archiveAllCards".format(listId));
}

function cleanupSubmissionsBoard(){
    console.log("Cleaning up Submissions board");
    trello.get("/1/boards/jVmpFPZ8/lists", function(err, data) {
        if (err) throw err;
        console.log(data.length + " lists will be removed");
        data.forEach(function(list){
            trello.put("/1/lists/{0}/closed".format(list.id), { value:"true" }, function(error){
                if (error) throw error;
            })
        })
    });

}

function listAllBoardLists(){
    trello.get("/1/boards/jVmpFPZ8/lists", function(err, data) {
        if (err) throw err;
        console.log("Board contains " + data.length + "lists");
    });
}

cleanupSubmissionsBoard();


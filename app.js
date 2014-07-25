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

function getSpreadsheetRows(processAllRows) {
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

                processAllRows(rowData);
            });
        });
    });
}

function splitTracksBySession(allRows, cbTracksAndSessions){
    var tracksBySession = {};
    for (var i = 0, len = allRows.length; i < len; i++) {
        var trackName = allRows[i].track;
        if (tracksBySession[trackName] === undefined){
            tracksBySession[trackName] = [];
        }
        tracksBySession[trackName].push(allRows[i]);
    }

    cbTracksAndSessions(tracksBySession);
}


function processRow(row) {
    console.log("Processing: [" + row.prénom + " " + row.nom + "] " + row.titre);
}

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

function getAllBoardLists(listCallback){
    trello.get("/1/boards/jVmpFPZ8/lists", function(err, data) {
        if (err) throw err;
        console.log("Board contains " + data.length + " lists");
        listCallback(data);
    });
}

function createList(name, listCreated){
    console.log("Creating new list: " + name);
    trello.post("/1/boards/jVmpFPZ8/lists", {name: name}, function (err, data){
        if (err) throw err;
        console.log("Created list: " + data.name);
        listCreated(data);
    })
}

function checkListExists(name){
    trello.get("/1/boards/jVmpFPZ8/lists/" + name, function(err, data){
       console.log(data);
    });
}

function printAllSessionsByTrack(sessionAndTracks){
    var keys = Object.keys(sessionAndTracks);
    console.log("Total tracks created: " + keys.length);
    keys.forEach(function (item){
        console.log(item + ": " + sessionAndTracks[item].length);
    });
}

function createCardsInList(listId, trackRows){
    trackRows.forEach(function(row){
        var card = {
            name: "[" + row.prénom + " " + row.nom + "] " + row.titre,
            desc: row.description,
            idList: listId,
            due: null,
            urlSource: null
        };
        trello.post("/1/cards", card, function(err, data){
            console.log("Card created: " + data.name);
        });
    });
}

function importTalksToListsPerTrack(){
    getSpreadsheetRows(function(allrows){
        splitTracksBySession(allrows, function(splitted){
            printAllSessionsByTrack(splitted);

            getAllBoardLists(function(boardLists){
                var trackNames = Object.keys(splitted);
                trackNames.forEach(function(trackName){
                    var idList;
                    boardLists.forEach(function(list){
                        if (list.name === trackName){
                            idList = list.id;
                        }
                    });

                    if (idList === undefined){
                        createList(trackName, function(newList){
                            boardLists.push(newList);
                            createCardsInList(newList.id, splitted[trackName]);
                        })
                    }
                    else{
                        console.log("List for track '{0}' already exists".format(trackName));
                        createCardsInList(idList, splitted[trackName]);
                    }
                })
            })
        })
    })
}

// Uncomment the line you want to execute
//cleanupSubmissionsBoard();
//importTalksToListsPerTrack();

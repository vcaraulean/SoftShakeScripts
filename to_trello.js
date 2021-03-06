var Trello = require("node-trello");
var credentials = require("./credentials.json");
var commons = require("./common.js");
var gSpreadsheet = require("./gSpreadsheet");

var trello = new Trello(credentials.trelloApiKey, credentials.trelloToken);

var submissionsBoardId = "jVmpFPZ8";

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

function printRow(row) {
    console.log("[{0}]   [{1} {2}] {3}".format(row.track, row.prénom, row.nom, row.titre));
}

function archiveAllCards(listId)
{
    trello.post("/1/lists/{0}/archiveAllCards".format(listId));
}

function closeAllListsFromBoard(boardId)
{
    console.log("Closing lists from board id: " + boardId);

    trello.get("/1/boards/{0}/lists".format(boardId), function(err, data) {
        if (err) throw err;
        console.log(data.length + " lists will be removed");
        data.forEach(function(list){
            trello.put("/1/lists/{0}/closed".format(list.id), { value:"true" }, function(error){
                if (error) throw error;
            })
        })
    });
}

function cleanupSubmissionsBoard(){
    console.log("Cleaning up Submissions board");
    closeAllListsFromBoard(submissionsBoardId);
}

function getAllBoardLists(boardId, listCallback){
    trello.get("/1/boards/{0}/lists".format(boardId), function(err, data) {
        if (err) throw err;
        console.log("Board contains " + data.length + " lists");
        listCallback(data);
    });
}

function createList(boardId, name, listCreated){
    console.log("Creating new list: " + name);
    trello.post("/1/boards/{0}/lists".format(boardId), {name: name}, function (err, data){
        if (err) throw err;
        console.log("Created list: " + data.name);
        listCreated(data);
    })
}

function printAllSessionsByTrack(sessionAndTracks){
    var keys = Object.keys(sessionAndTracks);
    console.log("Total tracks created: " + keys.length);
    keys.forEach(function (item){
        console.log(item + ": " + sessionAndTracks[item].length);
    });
}

function formatCardDescription(row){
    var description = row.description;

    description = description + "\n\r";
    description = description + " - **Thème:** {0}\n\r".format(row.thème);
    description = description + " - **Cathégorie:** {0}\n\r".format(row.catégorie);
    description = description + " - **Niveau(x):** {0}\n\r".format(row.niveaux);

    description = description + "\n\r";
    description = description + "**Bio**\n\r";
    description = description + row.biographie;
    description = description + "\n\r";


    description = description + "* * * \n\r";
    description = description + " - **Email:** {0}\n\r".format(row.email);
    description = description + " - **Ville, Pays:** {0}\n\r".format(row.villepays);
    description = description + " - **Profession / titre:** {0}\n\r".format(row.professiontitre);
    description = description + " - **Organisation:** {0}\n\r".format(row.organisation);

    return description;
}

function mapRowToCard(row, listId){
    var card = {
        name: "[" + row.prénom + " " + row.nom + "] " + row.titre,
        desc: formatCardDescription(row),
        idList: listId,
        due: null,
        urlSource: null
    };
    return card;
}

function createCardsInList(boardId, listId, trackRows){

    var cardsToCreate = [];

    trackRows.forEach(function(row){
        cardsToCreate.push(mapRowToCard(row, listId));
    });

    var handleExistingCards = function(existingCards){
        console.log("Found {0} cards in board".format(existingCards.length));

        cardsToCreate.forEach(function(cardToCreate){
            var found;
            existingCards.forEach(function(item){
                if (cardToCreate.name === item.name){
                    found = item;
                }
            });

            if (found === undefined)
            {
                trello.post("/1/cards", cardToCreate, function(err, data){
                    console.log("Card created: " + data.name);
                });
            }
            else{
                trello.put("/1/cards/{0}".format(found.id), {desc : cardToCreate.desc}, function(err, data){
                    console.log("Card updated: " + data.name);
                })
            }
        })
    };

    getAllCardsFromBoard(boardId, handleExistingCards);
}

function importAllTalksToSubmissionsBoard(){
    gSpreadsheet.processRow(function(allrows){
        splitTracksBySession(allrows, function(splitted){
            printAllSessionsByTrack(splitted);

            getAllBoardLists(submissionsBoardId, function(boardLists){
                var trackNames = Object.keys(splitted);
                trackNames.forEach(function(trackName){
                    var idList;
                    boardLists.forEach(function(list){
                        if (list.name === trackName){
                            idList = list.id;
                        }
                    });

                    if (idList === undefined){
                        createList(submissionsBoardId, trackName, function(newList){
                            boardLists.push(newList);
                            createCardsInList(submissionsBoardId, newList.id, splitted[trackName]);
                        })
                    }
                    else{
                        console.log("List for track '{0}' already exists".format(trackName));
                        createCardsInList(submissionsBoardId, idList, splitted[trackName]);
                    }
                })
            })
        })
    })
}

function listAllSubmissions()
{
    var printRows = function(rows){
        rows.forEach(function(item) {
            printRow(item);
        })
    };
    gSpreadsheet.processRow(printRows);
}

function createBoard(boardName, cbCreatedBoard){
    trello.post("/1/boards", {name: boardName, idOrganization:"softshake14"}, function(err, data){
        console.log("New board created: " + data.name);
        cbCreatedBoard(data);
    })
}

function getAllCardsFromBoard(boardId, cbAllCards){
    trello.get("/1/boards/{0}/cards".format(boardId), function(err, data){
        cbAllCards(data);
    })
}

function createTrackBoards(){
    gSpreadsheet.processRow(function(allrows) {
        splitTracksBySession(allrows, function (splitted) {
            var trackNames = Object.keys(splitted);

            var createRequiredBoardsIfMissing = function(boards){
                trackNames.forEach(function(trackName){
                    var boardId = undefined;
                    boards.forEach(function (board){
                       if (board.name === trackName){
                           boardId = board.id;
                       }
                    });

                    if (boardId === undefined){
                        // board not found, create
                        createBoard(trackName, function(board){
                            closeAllListsFromBoard(board.id);
                        })
                    }
                });
            };

            trello.get("/1/organizations/{0}/boards".format("softshake14"), function(err, data){
                createRequiredBoardsIfMissing(data);
            })
        })
    })
}

function createListsInTrackBoard(board, trackRows) {
    console.log("Creating predefined lists in board: " + board.name);
    var submissionsList;
    var updateBoardLists = function(existingLists){
        var day1List, day2List;
        existingLists.forEach(function(list){
            if (list.name === "Submissions") {
                submissionsList = list;
            }
            if (list.name === "Day 1") {
                day1List = list;
            }
            if (list.name === "Day 2"){
                day2List = list;
            }
        });

        if (day1List === undefined)
        {
            createList(board.id, "Day 1", function(l){});
        }

        if (day2List === undefined)
        {
            createList(board.id, "Day 2", function(l){});
        }

        if (submissionsList === undefined)
        {
            createList(board.id, "Submissions", function(list){
                console.log("Creating lists in track board: " + board.name);
                createCardsInList(board.id, list.id, trackRows);
            })
        }
        else
        {
            console.log("Submissions list already exists in board " + board.name);
            createCardsInList(board.id, submissionsList.id, trackRows);
        }

    };

    getAllBoardLists(board.id, updateBoardLists);

}

function uploadTracksToBoards() {
    gSpreadsheet.processRow(function (allrows) {
        splitTracksBySession(allrows, function (tracksAndSessions) {
            var trackNames = Object.keys(tracksAndSessions);

            trello.get("/1/organizations/{0}/boards".format("softshake14"), function(err, data){
                trackNames.forEach(function(trackName){
                    var board = undefined;
                    data.forEach(function(needle){
                        if (needle.name == trackName){
                            board = needle;
                        }
                    });

                    createListsInTrackBoard(board, tracksAndSessions[trackName])
                })
            })
        })
    })
}


// Uncomment the line you want to execute

listAllSubmissions();
//cleanupSubmissionsBoard();

//createTrackBoards();
//importAllTalksToSubmissionsBoard();
//uploadTracksToBoards();



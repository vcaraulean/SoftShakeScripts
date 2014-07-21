var GoogleSpreadsheet = require("google-spreadsheet");
var credentials = require("./credentials.json");

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

            console.log("Names:");
            for (var i = 0; i < rowData.length; i++) {
                printRowData(rowData[i]);
            }
        });
    });

});

function printRowData(row) {
    console.log(row.prénom + " " + row.nom);
};

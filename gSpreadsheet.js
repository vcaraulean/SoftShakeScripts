var GoogleSpreadsheet = require("google-spreadsheet");
var credentials = require("./credentials.json");

function getSpreadsheetRows(processAllRows) {
    var submissionsSheet = new GoogleSpreadsheet("1CTRSexIlUTCYTsPY2-pKLeOmCnaBtC0lKZLutVQoGJ8");

    submissionsSheet.setAuth(credentials.googleLogin, credentials.googlePassword, function (err) {
        if (err) {
            console.log(err);
            return;
        }

        submissionsSheet.getInfo(function (err1, sheetInfo) {
            if (err) {
                console.log(err);
                return;
            }
            console.log(sheetInfo.title + "");

            submissionsSheet.getRows(1, function (err2, rowData) {
                console.log("Pulled in " + rowData.length + " rows ");

                processAllRows(rowData);
            });
        });
    });
}

exports.processRow = getSpreadsheetRows;

var db;
var datatosend;
var Checkout;
function startup() {
    //Create the database
    console.log("Starting up...");
    db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(initDB, dbError, dbReady);

}

function dbError(e) {
    console.log("SQL ERROR" + e);
}

function initDB(tx) {

    tx.executeSql("create table if not exists EventDetailsTest11(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT )");
}

function dbReady() {

    console.log("DB initialization done.");
}
function AddEvent(EngName, AttenDate, EventDetail, EventStartTime, EventEndTime, Addon) {
    db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        //tx.executeSql ("DROP TABLE IF EXISTS EventDetailsTest11");
        tx.executeSql("create table if not exists EventDetailsTest11(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT )");
        tx.executeSql("INSERT INTO EventDetailsTest11(EngineerName,AttendanceDate,Event,StartTime,EndTime,AdditionalDetails) VALUES (?,?,?,?,?,?)", [EngName, AttenDate, EventDetail, EventStartTime, EventEndTime, Addon]);
        alert(EventDetail + " insert Complete");

    });
}

function GetJobDetails(EngName, AttendDate) {
    alert("Retrieving from the server");
    $.ajax({
        type: "GET",
        url: "http://localhost:52422/api/EngineerEvent?EngName=" + EngName + "&AttenDate=" + AttendDate,
        dataType: "json",
        success: function (data) {
            if (data.length >= 0) {
                db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
                var datavalue = data;
                var myJsonObj = datavalue;
                var e1 = [];
                db.transaction(function (ctx) {
                    for (i = 0; i < data.length; i++) {
                        e1 = myJsonObj[i];
                        
                            ctx.executeSql("INSERT INTO EventDetailsTest11(EngineerName,AttendanceDate,Event,StartTime,EndTime,AdditionalDetails) VALUES (?,?,?,?,?,?)", [e1.EngineerName, e1.AttendanceDate, e1.Event, e1.StartTime, e1.EndTime, e1.AdditionalDetails], dbError, dbReady);
                        

                    }
                });

            }
            else {
                alert("No data to be retrieved from the server");
            }

        },
        error: function (xhr) {
            alert("Unable to retrieve data from the server");
        }
    });
}

function GetDayEvent(EngineerName, Attendate) {
    var event;
    var start;
    var end;

    var EventName = new Array();
    var EventStartTime = new Array();
    var EventEndTime = new Array();
    var EventAdditionalDetails = new Array();
    db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("select distinct * from EventDetailsTest11 where EngineerName =? and AttendanceDate=? order by StartTime", [EngineerName, Attendate], function (tx, results) {

            if (results.rows.length > 0) {
                for (var i = 0; i < results.rows.length; i++) {

                    //EventName[i] = results.rows.item(i).Event;
                    EventName.push(results.rows.item(i).Event);
                    EventStartTime.push(results.rows.item(i).StartTime);
                    EventEndTime.push(results.rows.item(i).EndTime);
                    EventAdditionalDetails.push(results.rows.item(i).AdditionalDetails);
                    if (EventName[i] != "Checkout" && EventName[i] != "STOP")
                        CreateEvent(EventName[i], EventStartTime[i], EventEndTime[i], EventAdditionalDetails[i]);
                }

            }
            else {
                alert("No records to retrieve");


            }


        });

    });

}

function ClearTable(EngineerName, AttenDate) {

    db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        alert("Table Dropped");
        //tx.executeSql("Delete from EventDetailsTest11 where EngineerName =? and AttendanceDate=? ", [EngineerName, AttenDate]);
        tx.executeSql("DROP TABLE EventDetailsTest11");


    });

}


function DropTable(tx) {

    alert("Table Drop")
    tx.executeSql("DROP TABLE EventDetailsTest11");


}


function StartLoad(EngineerName, AttenDate, CheckoutType) {
    Checkout = CheckoutType;
    db = window.openDatabase("EventDetailsTest11", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("select distinct * from EventDetailsTest11 where EngineerName =? and AttendanceDate=? order by StartTime", [EngineerName, AttenDate], SendDetails, dbError)

    });

}

function SendDetails(tx, results) {
    var len = results.rows.length;
    var EventName = new Array();
    var EventStartTime = new Array();
    var EventEndTime = new Array();
    var EventAdditionalDetails = new Array();
    var EngName = new Array();
    var AttendanceDate = new Array();
    console.log("DEMO table: " + len + " rows found.");
    for (var i = 0; i < len; i++) {
        EngName.push(results.rows.item(i).EngineerName);
        AttendanceDate.push(results.rows.item(i).AttendanceDate);
        EventName.push(results.rows.item(i).Event);
        EventStartTime.push(results.rows.item(i).StartTime);
        EventEndTime.push(results.rows.item(i).EndTime);
        EventAdditionalDetails.push(results.rows.item(i).AdditionalDetails);
    }
    var Eventdata = JSON.stringify({
        EngineerName: EngName,
        AttendanceDate: AttendanceDate,
        Event: EventName,
        AdditionalDetails: EventAdditionalDetails,
        StartTime: EventStartTime,
        EndTime: EventEndTime,
    });
    alert(Eventdata);
    console.log("Sending data to the server");
    ////$.post("http://localhost:52422/api/EngineerEvent", datatosend);
    $.ajax({
        type: "POST",
        data: Eventdata,
        crossDomain: true,
        withCredentials: true,
        url: "http://localhost:52422/api/EngineerEvent",
        contentType: "application/json",
        traditional: true,
        success: function () {
            alert('Thanks for submitting your timesheet');
            alert(EngName[0] + AttendanceDate[0]);

            if (Checkout == 1) {
                db.transaction(DropTable);
                window.localStorage.removeItem("LastCheckinDate");
                window.localStorage.removeItem("LastCheckinTime");
                window.location.href = 'Navigation.html';
            }
            else {
                return;
            }

        },
        error: function () {
            alert('Failed loading data. Please retry');
            Result = 0;
            StartLoad(EngName[0], AttendanceDate[0]);
        }
    });


}

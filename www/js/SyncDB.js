var db;
var datatosend;
var Checkout;
function startup() {//Create the database
    console.log("Starting up...");
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(initDB, dbError, dbReady);

}

function dbError(e) {
    console.log("SQL ERROR" + e);
}

function initDB(tx) { // create table 
    tx.executeSql("DROP TABLE IF EXISTS EventDetailsTest123");
    tx.executeSql("create table if not exists EventDetailsTest123(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT, AddressDetails TEXT )");
}

function dbReady() {

    console.log("DB initialization done.");
}
function AddEvent(EngName, AttenDate, EventDetail, EventStartTime, EventEndTime, Addon, Address) { // Add an event to the local database
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        //tx.executeSql ("DROP TABLE IF EXISTS EventDetailsTest123");
        tx.executeSql("create table if not exists EventDetailsTest123(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT,AddressDetails TEXT )");
        tx.executeSql("INSERT INTO EventDetailsTest123(EngineerName,AttendanceDate,Event,StartTime,EndTime,AdditionalDetails,AddressDetails) VALUES (?,?,?,?,?,?,?)", [EngName, AttenDate, EventDetail, EventStartTime, EventEndTime, Addon, Address]);
        //alert(EventDetail + " insert Complete");

    });
}

function GetJobDetails(EngName, AttendDate) { //Retrieve timesheet details from the remote DB
    alert("Retrieving from the server");
    $.ajax({
        type: "GET",
        url: "http://10.0.1.39/EngTimesheetApp/api/EngineerEvent?EngName=" + EngName + "&AttenDate=" + AttendDate,
        dataType: "json",
        success: function (data) {
            if (data.length >= 0) {
                db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
                var datavalue = data;
                var myJsonObj = datavalue;
                var e1 = [];
                db.transaction(function (ctx) {
                    for (i = 0; i < data.length; i++) {
                        e1 = myJsonObj[i];
                        ctx.executeSql("create table if not exists EventDetailsTest123(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT,AddressDetails TEXT  )");
                        ctx.executeSql("INSERT INTO EventDetailsTest123(EngineerName,AttendanceDate,Event,StartTime,EndTime,AdditionalDetails,AddressDetails) VALUES (?,?,?,?,?,?,?)", [e1.EngineerName, e1.AttendanceDate, e1.Event, e1.StartTime, e1.EndTime, e1.AdditionalDetails, e1.AddressDetails], dbError, dbReady);


                    }
                });
                //alert("Finished retreiving from the server");
                //PopulateEvent();
                //location.reload();
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

function GetDayEvent(EngineerName, Attendate) { // Get all the event for a particular from the local DB
    var event;
    var start;
    var end;
    var count=0;
    var PreviousStart =null;
    var PreviousEnd =null;
    var EventName = new Array();
    var EventStartTime = new Array();
    var EventEndTime = new Array();
    var EventAdditionalDetails = new Array();
    var EventAddressDetails = new Array();
    window.localStorage.setItem("BreakCount", 0);
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("select distinct * from EventDetailsTest123 where EngineerName =? and AttendanceDate=? order by StartTime ASC", [EngineerName, Attendate], function (tx, results) {

            if (results.rows.length > 0) {
                for (var i = 0; i < results.rows.length; i++) {     //For each record in the local DB create an event and populate the DayPilot calendar

                    //EventName[i] = results.rows.item(i).Event;
                    EventName.push(results.rows.item(i).Event);
                    EventStartTime.push(results.rows.item(i).StartTime);
                    EventEndTime.push(results.rows.item(i).EndTime);
                    EventAdditionalDetails.push(results.rows.item(i).AdditionalDetails);
                    EventAddressDetails.push(results.rows.item(i).AddressDetails);
                    
                    
                    
                    if (EventName[i].trim() != "FINISH WORK" && EventName[i].trim() != "STANDSTILL"&&EventName[i].trim() != "START WORK") {  // Exclude the STOP details
                        if (PreviousEnd != null) {
                            var timeDiff = (new Date(EventStartTime[i]) - new Date(PreviousEnd)) / (60000);
                            if (timeDiff > 15)
                                count++;
                        }
                        if ( new Date(PreviousEnd) <= new Date(EventEndTime[i])) {
                            PreviousEnd = EventEndTime[i];
                        }
                        
                        //CreateEvent(EventName[i], EventStartTime[i], EventEndTime[i], EventAdditionalDetails[i], EventAddressDetails[i]);
                    }
                    window.localStorage.setItem("BreakCount", count);
                    CreateEvent(EventName[i], EventStartTime[i], EventEndTime[i], EventAdditionalDetails[i], EventAddressDetails[i]);
                    
                }
                
            }
            else {
                alert("No records to retrieve");

            }


        });

    });
    
}

function ClearTable(EngineerName, AttenDate) {

    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        alert("Table Dropped");
        //tx.executeSql("Delete from EventDetailsTest123 where EngineerName =? and AttendanceDate=? ", [EngineerName, AttenDate]);
        tx.executeSql("DROP TABLE EventDetailsTest123");


    });

}


function DeleteRecord(EngineerName, AttenDate, Event, StartTime) {

    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        alert("Record Deleted");
        //tx.executeSql("Delete from EventDetailsTest123 where EngineerName =? and AttendanceDate=? and Event =? and StartTime=?  ", [EngineerName, AttenDate, Event,StartTime]);
        tx.executeSql("DROP TABLE EventDetailsTest123");


    });

}


function DropTable(tx) {

    //alert("Table Drop")
    tx.executeSql("DROP TABLE EventDetailsTest123");


}


function StartLoad(EngineerName, AttenDate, CheckoutType) {  // Retrieve data from the local DB for a particular day
    Checkout = CheckoutType;
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("select distinct * from EventDetailsTest123 where EngineerName =? and AttendanceDate=? order by StartTime ASC", [EngineerName, AttenDate], SendDetails, dbError)

    });

}

function SendDetails(tx, results) {          // function to send data to the remote DB
    var len = results.rows.length;
    var EventName = new Array();
    var EventStartTime = new Array();
    var EventEndTime = new Array();
    var EventAdditionalDetails = new Array();
    var EngName = new Array();
    var AttendanceDate = new Array();
    var EventAddressDetails = new Array()
    console.log("DEMO table: " + len + " rows found.");
    for (var i = 0; i < len; i++) {
        EngName.push(results.rows.item(i).EngineerName);
        AttendanceDate.push(results.rows.item(i).AttendanceDate);
        EventName.push(results.rows.item(i).Event);
        EventStartTime.push(results.rows.item(i).StartTime);
        EventEndTime.push(results.rows.item(i).EndTime);
        EventAdditionalDetails.push(results.rows.item(i).AdditionalDetails);
        EventAddressDetails.push(results.rows.item(i).AddressDetails);
    }
    var Eventdata = JSON.stringify({
        EngineerName: EngName,
        AttendanceDate: AttendanceDate,
        Event: EventName,
        AdditionalDetails: EventAdditionalDetails,
        StartTime: EventStartTime,
        EndTime: EventEndTime,
        AddressDetails: EventAddressDetails,
    });

    console.log("Sending data to the server");

    $.ajax({    // Post the data back to the Server
        type: "POST",
        data: Eventdata,
        crossDomain: true,
        withCredentials: true,
        url: "http://10.0.1.39/EngTimesheetApp/api/EngineerEvent",
        contentType: "application/json",
        traditional: true,
        success: function () {
            alert('Thanks for submitting your timesheet');
            //alert(EngName[0] + AttendanceDate[0]);

            if (Checkout == 1) {
                db.transaction(DropTable);
                window.localStorage.removeItem("LastCheckinDate");
                window.localStorage.removeItem("LastCheckinTime");
                window.localStorage.removeItem("BreakCount");
                
                window.location.href = 'Navigation.html';
            }
            else {
                location.reload();
            }

        },
        error: function () {
            alert('Failed loading data. Please retry');
            Result = 0;
            StartLoad(EngName[0], AttendanceDate[0]);
        }
    });


}

function GetLastStandStill(EngineerName, CheckinDate) { // Get the standstill time for the last trip
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("select * from EventDetailsTest123 where EngineerName =? and AttendanceDate=? and Event like ?  order by StartTime DESC", [EngineerName, CheckinDate,'TRIP%'], GetStandStill, dbError)
    });
}
function GetStandStill(tx, results) {
    var len = results.rows.length;
    var EngName;
    var AttenDate;
    var EndTime;
    for (var i = 0; i < len; i++) {
        EngName = results.rows.item(0).EngineerName;
        AttenDate = results.rows.item(0).AttendanceDate;
        EndTime = results.rows.item(0).EndTime;

    }

    $.ajax({        // ajax call to get the infomation forom the remote server
        type: "GET",
        url: "http://10.0.1.39/EngTimesheetApp/api/EngineerEvent?EngName=" + EngName + "&AttenDate=" + AttenDate + "&LastStop=" + EndTime,
        dataType: "json",
        success: function (data) {
            if (data.length >= 0) {
                db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
                var datavalue = data;

                db.transaction(function (ctx) {
                    alert(datavalue);
                    ctx.executeSql("create table if not exists EventDetailsTest123(EngineerName TEXT ,AttendanceDate DATETIME ,Event TEXT ,StartTime DATETIME ,EndTime DATETIME,AdditionalDetails TEXT,AddressDetails TEXT  )");
                    ctx.executeSql("INSERT INTO EventDetailsTest123(EngineerName,AttendanceDate,Event,StartTime,EndTime,AdditionalDetails,AddressDetails) VALUES (?,?,?,?,?)", [EngName, CheckinDate, 'STANDSTILL', datavalue, EndTime], dbError, dbReady);
                    CreateEvent('STANDSTILL', datavalue, EndTime, '', '');


                });
                // alert("Finished retreiving from the server");
                //PopulateEvent();
                //location.reload();
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

function UpdateEvent(EngineerName, CheckinDate,OldStart,OldEnd,newStart,newEnd) { // Get the standstill time for the last trip
    db = window.openDatabase("EventDetailsTest123", "1", "EngTimeSheetTest Database", 1000000);
    db.transaction(function (tx) {
        tx.executeSql("UPDATE EventDetailsTest123 SET StartTime =?, EndTime =? WHERE EngineerName=? and AttendanceDate =? and startTime=? and EndTime =?", [newStart, newEnd, EngineerName, CheckinDate, OldStart, OldEnd], dbReady, dbError)
        location.reload();
    });
}
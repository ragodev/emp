
var emplogin = ""

//////////// RPC Functions ///////////////
function rpcSend(command, params) {
	var ret = null

	cmd = "EMPService." + command;

	ret = $.ajax({
	    type: "POST",
	    url: "/rpc",
	    headers: {"Authorization" : "Basic " + window.emplogin},
	    // The key needs to match your method's input parameter (case-sensitive).
	    data: JSON.stringify({ method: cmd, params: params, id: 1}),
	    contentType: "application/json; charset=utf-8",
	    dataType: "json",
	    async: false
	});

	if (ret.status != 200) {
		return null
	}

	return $.parseJSON(ret.responseText)
}

function isLoggedIn() {
	if (window.emplogin == "") {
		return false;
	}

	resp = rpcSend("Version", []);
	if (resp == null) {
		return false;
	} else if (resp.error == "Unauthorized") {
		return false;
	}

	return true;
}

function LogIn(user, pass) {
	window.emplogin = window.btoa(user + ":" + pass);
	return isLoggedIn();
}

//////////// Cookie Functions (from W3Schools) /////////////
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) != -1) return c.substring(name.length, c.length);
    }
    return "";
}

/////////////// Util Functions ////////////////////
function ArrayToBase64( buffer ) {
    var binary = ''
    var bytes = new Uint8Array( buffer )
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] )
    }
    return window.btoa( binary );
}

/////////////// Modal Functions ///////////////////

function messageModal(txidHash) {

	res = rpcSend("OpenMessage", [txidHash])
	message = res.result
	date = new Date(Date.parse(message.info.sent));
	$("#messageModal").children().children("#sender").text(message.info.sender)
	$("#messageModal").children().children("#recipient").text(message.info.recipient)
	$("#messageModal").children().children("#sent").text(date.toLocaleString())
	if (message.decrypted != null) {
		$("#messageModal").children().children("#subject").text(message.decrypted.Subject)
		$("#messageModal").children().children("#mime").text(message.decrypted.MimeType)
		$("#messageModal").children("#text").text(message.decrypted.Content)
	}

	$.colorbox({inline:true, href:"#messageModal", width:"50%",
				onLoad:function(){ $("#messageModal").show(); },
				onCleanup:function(){ $("#messageModal").hide(); reloadPage(); }
				});
}

/////////////// Main Functions //////////////////////
function reloadPage() {
	var msg
	switch (window.location.hash) {
		case "#outbox":
			$("h3#box").text("Outbox");

			msg = rpcSend("Outbox", [])

			break;
		case "#sendbox":
			$("h3#box").text("Sendbox");
			msg = rpcSend("Sendbox", [])
			break;
		case "#address":
			$("h3#box").text("Address Book");
			msg = null
			break;
		case "":
			window.location.hash = "#inbox"
		case "#inbox":
			$("h3#box").text("Inbox");
			msg = rpcSend("Inbox", [])
	}
	$("#refresh").attr("href", window.location.hash)

	$("table#main").children("colgroup").html("")
	$("table#main").children("thead").html("")
	$("table#main").children("tbody").html("")
	$("table#main").children("tbody").attr("class", "datarow")

	if (msg != null) {
		// Clear Everything

		$("table#main").attr("class", "table-4")
		for (var i = 0; i < 4; i++) {
			$("table#main").children("colgroup").append("<col span='1'>");
		}
		$("table#main").children("thead").append("\
			<tr>\
            	<th>Date</th>\
            	<th>From</th>\
            	<th>To</th>\
            	<th>Status</th>\
	        </tr>");
		for (var i = 0; i < msg.result.length; i++) {
			var unread
			if (msg.result[i].read) {
				unread = "Read"
			} else {
				unread = "Unread"
			}

			date = new Date(Date.parse(msg.result[i].sent));

			$("table#main").children("tbody").prepend("\
			<tr onclick='messageModal(\"" + ArrayToBase64(msg.result[i].txid_hash) + "\")'>\
            	<td data-th='date'>" + date.toLocaleString() + "</td>\
            	<td data-th='from'>" + msg.result[i].sender + "</td>\
            	<td data-th='to'>" + msg.result[i].recipient + "</td>\
            	<td data-th='status'>" + unread + "</td>\
	        </tr>");
		}
	}
}
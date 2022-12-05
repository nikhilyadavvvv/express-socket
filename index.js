const express = require("express");
const port = process.env.PORT || 3000;
const app = express();
const server = require("http").createServer(app);
const WebSocket = require("ws");

app.use(require("body-parser").urlencoded({ extended: false }));
const wss = new WebSocket.Server({ server: server });
var id = 0;
var lookup = [];
var client_size = 0;
var console_log = "";
var console_count = 0;
wss.on("connection", function connection(ws, req) {
  if (console_log.length > 1000) {
    console_log = "";
  }
  if (client_size >= lookup.length + 2) {
    for (const client of wss.clients) {
      client.close();
      console.log("closing client");
    }
  }
  console.log("type: ", getQueryVariable("type", req.url));
  console.log("number: ", getQueryVariable("number", req.url));
  var ws_type = getQueryVariable("type", req.url);
  var ws_number = getQueryVariable("number", req.url);

  if (ws_type == "senderClient") {
    ws.number = ws_number;
    if (!containsObject(ws, lookup)) {
      //deleteFromArray(lookup, ws);
      lookup.push(ws);
      consoleLog("added: " + ws.number);
    }
  }

  console.log("A new client Connected!");
  //  ws.send("Welcome New Client!");
  console.log("wss.clients.size", wss.clients.size);
  client_size = wss.clients.size;
  ws.on("message", function incoming(message) {
    const response = JSON.parse(message);
    console.log("received: %s", response.type);
    console.log("message", response.message);
    const client = lookup[0];
    if (
      client &&
      client !== ws &&
      client.readyState === WebSocket.OPEN &&
      response.type === "otp_generator"
    ) {
      client.send(JSON.stringify(response.message));
      consoleLog(client.number + ": " + JSON.stringify(response.message));
    }
    lookup = roundRobin(lookup);
  });

  ws.on("close", function close() {
    console.log("disconnected");
    consoleLog("disconnected: " + ws.number);
    deleteFromArray(lookup, ws);
    console.log(lookup.length);
    client_size = wss.clients.size;
  });

  if (console_log.length > 1000) {
    console_log = "";
  }
});

wss.off;

function deleteFromArray(array, obj) {
  const index = array.indexOf(obj);
  if (index > -1) {
    array.splice(index, 1);
    consoleLog("popped: " + obj.number);
  }
}

function roundRobin(array) {
  const temp = array[0];
  array.shift();
  array.push(temp);
  return array;
}

function consoleLog(str) {
  console_log += "<br>";
  console_log += console_count;
  console_log += ". ";
  console_log += str;
  console_count++;
}

function getQueryVariable(variable, url) {
  var url_string = "http://www.example.com" + url; //window.location.href
  var url = new URL(url_string);
  var c = url.searchParams.get(variable);
  return c;
}

function containsObject(obj, list) {
  var i;
  for (i = 0; i < list.length; i++) {
    if (list[i].number === obj.number) {
      return true;
    }
  }
  return false;
}

function getLookupDevices() {
  var lookupDevices = [];
  for (let i = 0; i < lookup.length; i++) {
    const lookupdevice = lookup[i].number;
    lookupDevices.push(lookupdevice);
  }
  return lookupDevices;
}

app.get("/", (req, res) => res.send("Hello World!"));
app.get("/start", (req, res) => {
  res.send("Server Started propbably");
});

app.get("/stop", (req, res) => {
  res.send("Server Stopped propbably");
});

app.get("/clients", (req, res) => {
  res.send(
    "total clients ==" + client_size + "/ lookup size ==" + lookup.length
  );
});

app.get("/console", (req, res) => {
  res.send(console_log);
});

app.get("/cconsole", (req, res) => {
  console_log = "";
  res.send(console_log);
});

app.get("/lookup", (req, res) => {
  var lookupDevices = getLookupDevices();
  res.json(lookupDevices);
});

app.get("/restart", (req, res) => {
  consoleLog("restarting server");
  for (const client of wss.clients) {
    setTimeout(function () {
      client.close();
    }, 500);
  }
  res.send("server restarted");
});

app.post("/sms", function (req, res) {
  var address = req.body.address;
  var message = req.body.message;
  consoleLog(address + ": " + message);
  res.json({ address, message });
});

server.listen(port, () => console.log(`Lisening on port :${port}`));

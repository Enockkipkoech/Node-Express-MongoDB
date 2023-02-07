const EventEmitter = require("events"); //Nodejs bbuild-in Events module
const http = require("http");

class Sales extends EventEmitter {
  constructor() {
    super();
  }
}

const myEmmiter = new Sales();

myEmmiter.on("newSale", () => {
  console.log("There is a new sale");
});

myEmmiter.on("newSale", () => {
  console.log("Customer name: Enock");
});

myEmmiter.on("newSale", (stock) => {
  console.log(`There are ${stock} stocks remaining in store.`);
});

myEmmiter.emit("newSale", 9);

//****************************************************************** */
const server = http.createServer();
server.on("request", (req, res) => {
  console.log("Request Received");
  console.log(req.url);
  res.end(" This is server response- I've rescived request!");
});

server.on("request", (req, res) => {
  console.log("Request 2 Received");
  console.log(" Another Request!");
});

server.on("close", () => {
  console.log("server closed!");
});

server.listen(8000, "127.0.0.1", () => {
  console.log("Waiting for request....");
});

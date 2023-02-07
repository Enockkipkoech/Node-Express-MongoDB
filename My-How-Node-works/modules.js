// console.log(arguments);
// console.log(require("module").wrapper);

//module.exports = Calculator
const Calculator = require("./test-module1");

const calculator1 = new Calculator();

console.log(calculator1.divide(10, 5));

//Exports
//const calc2 = require("./test-module2.js");
const { add, multiply, divide } = require("./test-module2.js");
console.log(add(2, 7));

//caching
require("./test-module3")();
require("./test-module3")();
require("./test-module3")();

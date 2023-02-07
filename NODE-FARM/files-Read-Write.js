//FILES
const fs = require('fs'); 


//Blocking, synchronous way
const textInput = fs.readFileSync('./txt/input.txt', 'utf-8');
console.log(textInput);
const textOutput = `This is what we know about the avocado: ${textInput}. \n Created ${Date.now()}`;
console.log(textOutput);
fs.writeFileSync('./txt/textOutput.txt', textOutput);
console.log("File written!");


//Non-blocking, Asynchronous way using Callback function a.k.a Callback Hell
fs.readFile('./txt/start.txt','utf-8', (err, data1) => {
    if(err){
        return console.log('Error on data1!')
    }
    fs.readFile(`./txt/${data1}.txt`,'utf-8', (err, data2) => {
        console.log(data2);
        fs.readFile('./txt/append.txt', 'utf-8', (err, data3) => {
            console.log(data3);

            fs.writeFile('./txt/final.txt', `${data2} \n ${data3}`, 'utf-8', err => {
                console.log('Your final file is written');
            });
        });
    });    
});
console.log("Reading file....")

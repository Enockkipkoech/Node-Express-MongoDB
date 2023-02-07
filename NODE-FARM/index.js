//SERVER
const fs = require('fs');
const http = require('http');
const url = require('url');

const slugify = require('slugify'); // used to create slugs- last id of browser url.

const replaceTemplate = require('./modules/replaceTemplate');

//Routing Templates/ Template Read
const tempOverview = fs.readFileSync(
  `${__dirname}/templates/template-overview.html`,
  'utf-8'
);
const tempCard = fs.readFileSync(
  `${__dirname}/templates/template-card.html`,
  'utf-8'
);
const tempProduct = fs.readFileSync(
  `${__dirname}/templates/template-product.html`,
  'utf-8'
);

//Synchronous Data Read
const dataFile = fs.readFileSync(`${__dirname}/dev-data/data.json`, 'utf-8');
const dataObj = JSON.parse(dataFile);

const slugs = dataObj.map((el) =>
  slugify(el.productName, {
    lower: true,
  })
);
console.log(slugs);

const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);

  //OVERVIEW PAGE
  if (pathname === '/' || pathname === '/overview') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });

    const cardsHtml = dataObj
      .map((el) => replaceTemplate(tempCard, el))
      .join('');
    const output = tempOverview.replace('{%PRODUCT_CARDS%}', cardsHtml);
    res.end(output);

    //PRODUCT PAGE
  } else if (pathname === '/product') {
    res.writeHead(200, {
      'Content-type': 'text/html',
    });
    const product = dataObj[query.id];
    const output = replaceTemplate(tempProduct, product);
    res.end(output);

    //API
  } else if (pathname === '/API') {
    res.writeHead(200, {
      'content-type': 'application/json',
    }); // Tells browser which data to expect - (JSON DATA)
    res.end(dataFile);
  }

  //NOT FOUND PAGE
  else {
    res.writeHead(404, {
      'content-type': 'text/html', //Tell browser to expect html text data
      'my-own-header': 'Hello world!',
    });
    res.end('<h1>Page not found!</h1>');
  }
});

PORT = 8000;
server.listen(PORT, '127.0.0.1', () => {
  console.log('Listening to requests on port:' + PORT);
});

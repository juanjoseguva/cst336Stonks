//declarations
const express = require('express');
const app = express();
const pool = require("./public/js/dbPool.js");
const fetch = await import('node-fetch');
const session = require('express-session');
app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));
app.use(session({'secret':'w5qkR82SoE&WV26q'}));

//variables
const apiKey = "cj0k099r01qgc2gj4pogcj0k099r01qgc2gj4pp0";

// Define routes and their handlers

// Home page route
app.get('/', async (req, res) => {
  if(req.session.userid !== undefined){
    let rows = await getStories(req.session.userid);
    res.render('dashboard',{"stories":rows});
    return;
  }
  res.render('index');
});


// Signup route
app.get("/signup", (req, res) => {
  let uName = req.query.uName;
  let password = req.query.password;
  if(uName === undefined || password === undefined){
    uName = "";
    password = "";
  }
  let newUser = [uName, password]
  res.render('signup', {"newUser":newUser});
});

app.post("/signup", async (req, res) => {
  let fName = req.body.fName;
  let lName = req.body.lName;
  let uName = req.body.uName;
  let sql = "SELECT * FROM s_suckers WHERE uName = ?";
  let params = [uName];
  let rows = await executeSQL(sql, params);
  if(rows.length > 0){
    res.render('signup', {"message":"Username taken!"}); 
    return;
  }
  let password = req.body.password;
  let bday = req.body.bday;
  let sex = req.body.sex;
  let cCard = req.body.cCard;
  // Insert the new user's data into the database 
  sql = "INSERT INTO s_suckers (fName, lName, uName, bday, password, cCard) VALUES (?, ?, ?, ?, ?, ?);"
  params = [fName, lName, uName, bday, password, cCard];
  rows = await executeSQL(sql, params);
  res.render('index', {"message":"Welcome aboard! Please login with your new credentials."});
});

// Login route
app.post("/login", async(req, res) => {
  let uName = req.body.uName;
  let password = req.body.password;
  let sql = "SELECT userId FROM s_suckers WHERE uName = ? and password = ?";
  let params = [uName, password];
  let rows = await executeSQL(sql, params);
  if(rows.length > 0){
    let userId = rows[0].userId;
    req.session.userid = userId;
    rows = await getStories(userId);
    res.render('dashboard',{"stories":rows});
  } else {
    res.render('index', {"message":"User not found, try again!"});
  }
});

// Search Stocks route
app.get('/searchStocks', async (req, res) =>{
  let validResults = [];
  if (req.query.userQuery == ""){
    let rows = await getStories(req.session.userid);
    res.render('dashboard',{"searchMessage":"Search cannot be empty.", "stories":rows});
    return;
  }
  let url = `https://finnhub.io/api/v1/search?q=${req.query.userQuery}&token=${apiKey}`
  let response = await fetch(url);
  let data = await response.json();
  for(let stock of data.result){
    if (!stock.symbol.includes('.')){
      let stockUrl = `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`;
      let stockResponse = await fetch(stockUrl);
      let stockData = await stockResponse.json();
      stockUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${stock.symbol}&token=${apiKey}`;
      stockResponse = await fetch(stockUrl);
      let companyData = await stockResponse.json();
      let result = {
        symbol: stock.symbol,
        description: stock.description,
        openPrice: stockData.o,
        currentPrice: stockData.c,
        website: companyData.weburl,
        logo: companyData.logo      
      };
      validResults.push(result);
    }
  }
  res.render('stocklist', {"searchResults": validResults});
})

// Purchase route
app.get('/purchase', async (req,res) => {
  res.render('purchase', {
    "stock":req.query.sym,
    "openPrice":req.query.open,
    "currentPrice":req.query.current
  });
});

app.post('/purchase', async (req, res) => {
  let amount = req.body.quantity;
  let ticker = req.body.ticker;
  let loot = req.body.loot;
  let userId = req.session.userid;
  if(typeof userId === 'undefined'){
    res.render('index');
    return;
  }
  // Insert the purchase details into the database
  let sql = "INSERT INTO s_portfolio (userId, ticker, buyDate, amount) VALUES (?, ?, NOW(), ?);"
  let params = [userId, ticker, amount];
  let rows = await executeSQL(sql, params);
  sql = `INSERT INTO s_loot (userId, looted, date) VALUES (${userId}, ${loot}, NOW())`;
  rows = await executeSQL(sql);
  rows = await getStories(userId);
  res.render('dashboard',{"stories":rows});
});

//portfolio route
app.get("/portfolio", async (req, res) => {
  let userId = req.session.userid;
  if(typeof userId === 'undefined')
  {
    res.render("index");
    return;
  }
  let sql = "SELECT ticker, SUM(amount) AS totalAmount FROM s_portfolio WHERE userId = ? GROUP BY ticker";
  let params = [userId];
  let rows = await executeSQL(sql, params);
  let totalStocks = rows.reduce((total, stock) => total + Number(stock.totalAmount), 0);
  let totalVals = 0;//total user has invested and currently holds
  for (let stock of rows) {
    stock.percentage = (Number(stock.totalAmount) / totalStocks) * 100;
    let stockUrl = `https://finnhub.io/api/v1/quote?symbol=${stock.ticker}&token=${apiKey}`;
    let stockResponse = await fetch(stockUrl);
    let stockData = await stockResponse.json();
    stock.totalVal = (stockData.c*stock.totalAmount);
    totalVals += Number(stock.totalVal);
     stock.totalVal = stock.totalVal.toFixed(2);
  }
  for (let stock of rows){
    stock.percentageCurrency = (stock.totalVal / totalVals) * 100;
  }
  res.render('portfolio', {"stocks": rows, "totalVals": totalVals});
});

app.get("/dbTest", async function(req, res){
let sql = "SELECT CURDATE()";
let rows = await executeSQL(sql);
res.send(rows);
});//dbTest

// Logout route
app.get("/logout", (req, res) => {
  req.session.userid = undefined;
  res.render("index");
});

//functions
async function executeSQL(sql, params){
return new Promise (function (resolve, reject) {
pool.query(sql, params, function (err, rows, fields) {
if (err) throw err;
   resolve(rows);
});
});
}//executeSQL

function formatDate(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0'); // Add leading zero if needed
  let day = String(date.getDate()).padStart(2, '0'); // Add leading zero if needed
  return `${year}-${month}-${day}`;
}

async function getStories(userId) {
  let sql = `SELECT DISTINCT ticker FROM s_portfolio WHERE userId = ${userId}`;
  let rows = await executeSQL(sql);

  for (let stock of rows) {
    let today = new Date();
    let yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    today = formatDate(today);
    yesterday = formatDate(yesterday);

    let stockUrl = `https://finnhub.io/api/v1/company-news?symbol=${stock.ticker}&from=${yesterday}&to=${today}&token=${apiKey}`;
    let stockResponse = await fetch(stockUrl);
    let stockData = await stockResponse.json();

    stock.stories = stockData; // Set the stories property as an array of news stories
  }

  return rows; // Return the array of stock objects with the stories property
}


//start server
app.listen(3000, () => {
console.log("Expresss server running...")
} )

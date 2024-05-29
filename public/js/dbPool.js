//connecting to the database 
const mysql = require('mysql');

const pool  = mysql.createPool({
    connectionLimit: 10,
    host: "dfkpczjgmpvkugnb.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
    user: "yn1oz5wj7fgbnrd2",
    password: "liwuwu9gj1fotj0n",
    database: "jruj86yjj0mdl6ko"
});

module.exports = pool;
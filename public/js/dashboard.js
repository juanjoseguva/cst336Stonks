//request unique tickers from db based on userid in session
let sql = `SELECT DISTINCT ticker FROM s_portfolio`
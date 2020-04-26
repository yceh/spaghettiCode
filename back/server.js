const http = require('http')
const mariadb = require('mariadb')
const hostname = '127.0.0.1'
const port = 8080

const db = mariadb.createConnection({ socketPath: '/var/lib/mysql/mysql.sock', user: '' }).then(
  conn => {
    conn.query("use mutationArticles");
    return conn;
  }
).catch(err => {
  console.log("db err" + err);
  process.exit(1);
})

function serveNextAbstract(res) {
  db.then(conn => {
    conn.query("SELECT pubmedID,abstract,PMCID,doi FROM article WHERE excludeReason IS NULL && knockOut IS NULL && mutagen IS NULL LIMIT 1").then(
      rows => { res.end(JSON.stringify(rows[0])); });
    return conn;
  })
}
function serveExcludeReason(res) {
  db.then(conn => {
    conn.query("SELECT reason from excludeReason;").then(
      rows => { res.end(JSON.stringify(rows.map(e=>e.reason))); });
  })
}
function handleUpdate(body) {
  var dbTransections = [];
  dbTransections.push(db.then(conn => {
    conn.query("UPDATE article set mutagen=?, knockout=?, accession=?, repo=? WHERE pubmedID=?", [body.mutagen, body.knockout, body.accession, body.repo, body.pubmedID]);
  }));

  if (body.excludeReason == null) {
    if (body.word.length > 0) {
      dbTransections.push(db.then(conn => { 
        Promise.all(body.word.map(b=>conn.query("CALL insertKeywordAccept(?,?,?);",[body.pubmedID,b[0],b[1]])));
      }));
    }else{
      console.log(body.word);
    }
  } else {
    dbTransections.push(db.then(conn => { conn.query("CALL updateExcludeReason(?,?);", [body.pubmedID, body.excludeReason]); }));
    if (body.word.length > 0) {
      dbTransections.push(db.then(conn => { 
        Promise.all(body.word.map(b=>conn.query("CALL insertKeywordReject(?,?,?);",[body.pubmedID,b[0],b[1]])));
      }));
     }else{
      console.log(body.word);
    }
  }
  return Promise.all(dbTransections).then(function () { db.then(conn => { conn.commit(); }) });
}
const server = http.createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method == 'GET') {
    switch(req.url){
      case '/nextAbstract':
        serveNextAbstract(res);
        break;
      case '/excludeReasons':
        serveExcludeReason(res);
        break;
      default:
        res.statusCode=404;
        break;
    }
  }
  else {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      handleUpdate(JSON.parse(body)).then(serveNextAbstract(res));
    });
  }
})

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`)
})
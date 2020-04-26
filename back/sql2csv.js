const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const mariadb = require('mariadb');
exports.connect=function (user,dbname){
 return mariadb.createConnection({ socketPath: '/var/lib/mysql/mysql.sock', user: user }).then(
    conn => {
      conn.query("use "+dbname);
      return conn;
    }
  ).catch(err => {
    console.log("db err" + err);
    process.exit(1);
  });
}

exports.sql2csv=function (db,query,path){
  db.then(conn => {
    conn.query(query).then(
      rows => {
        const csvWriter = createCsvWriter({
            path: path,
            header: 
                Object.keys(rows[0]).map(e=>{return({id: e,title : e})})
        });
        return (csvWriter.writeRecords(rows));
    });
  })
}

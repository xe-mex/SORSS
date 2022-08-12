const {Pool} = require("pg")

const pg = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'Ud2',
    password: '12345678',
    port: 5432
})

function getDb() {
    return pg;
}

module.exports = getDb();
//module.exports = pg;

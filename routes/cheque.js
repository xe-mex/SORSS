const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select ch.id as "chequeId", online, ch.number as "chequeNumber", total, confirm, to_char("date", \'YYYY-MM-DD\') as date, cn.number as "contractNumber", cn.id as "contractId" from "Cheque" ch inner join "Contracts" cn on ch.contract = cn.id')
        .then((r)=>{
            //console.log(r.rows);
            res.send(r.rows);
            //console.log(`Отправлено ${r.rowCount} записей`);
            process.stdout.write(`Отправлено ${r.rowCount} записей `);
        })
        .catch(e=>{
            console.error(e);
            next(createError(500));
        })
})

router.post('/add', express.json(), (req, res, next)=>{
    if (!req.body
        // || !req.body.date
        || !req.body.total
        || !req.body.number
        || !req.body.contract
        || !(req.body.online === true || req.body.online === false)
        // || !(req.body.confirm === true || req.body.confirm === false)
        //req.body.open &&
    ){
        console.log(req.body)
        return next(createError(400, 'syntax error'))
    }

    const date = new Date();
    const dateStr = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`

    pg.query('insert into "Cheque" (date, total, number, online, contract) values ($1, $2, $3, $4, $5) returning id',
        [dateStr, req.body.total, req.body.number, req.body.online, req.body.contract])
        .then(r=>{
            //console.log(r);
            if (r.rowCount){
                console.log('Добавлена новая запись');
                res.send({newId: r.rows[0].id})
            }
            else throw new Error('Нет записи')
        })
        .catch(e=>{
            console.log(e);
            if (e.code === '23503'){
                return next(createError(404))
            }
            next(createError(500));
        })
})

router.get('/get/one', (req, res, next)=>{0
    const id = req.query['id']
    const full = req.query['full']

    if (!id) {
        return next(createError(400, 'inspected id'))
    }

    let sql = null;
    if (full){
        sql = 'select * from "Cheque" where id = $1';
    }
    else {sql = 'select ch.id as "chequeId", online, ch.number as "chequeNumber", total, confirm, to_char("date", \'YYYY-MM-DD\') as date, cn.number as "contractNumber", cn.id as "contractId" from "Cheque" ch inner join "Contracts" cn on ch.contract = cn.id where ch.id = $1'}

    pg.query(sql,
        [id])
        .then(r=>{
            if (r.rowCount){
                console.log('Отправлена 1 запись')
                res.send(r.rows[0])
            }
            else {
                console.log('Запись не найдена')
                next(createError(404))
            }
        })
        .catch(e=>{
            console.error(e)
            next(createError(500));
        })
})

router.put('/update', express.json(), (req, res, next)=>{
    const body = req.body
    if (!body
        || !body.old || !body.new
        || !body.old.date
        || !body.old.number
        || !body.old.total || !body.new.total
        || !body.old.contract || !body.new.contract
        || !(body.old.online === false || body.old.online === true)
        || !(body.old.confirm === false || body.old.confirm === true)
        || !(body.new.online === true || body.new.online === false)
        || !(body.new.confirm === true || body.new.confirm === false)
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Cheque" where id = $1 and date = $2 and number = $3 and total = $4 and online = $5 and confirm = $6 and contact = $7',
        [body.old.id, body.old.date, body.old.number, body.old.total, body.old.online, body.old.confirm, body.old.contract])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Cheque" set total = $1, online = $2, confirm = $3, contact = $4 where id = $5',
                [body.new.total, body.new.online, body.new.confirm, body.new.contract, id])
        })
        .then(r=>{
            if (r.rowCount){
                console.log('Обновление записи успешно');
                res.send({status: true});
            }
            else {
                throw new Error('Не удалось обновить запись');
            }
        })
        .catch(e=>{
            console.error(e);
            if (e.message === '404' || e.code === '23503'){
                return next(createError(404));
            }
            else next(createError(500));
        })
})

router.delete('/delete', (req, res, next)=>{
    const id = req.query['id'];

    if (!id) {
        console.log('Пустой запрос на удаление');
        return next(createError(400));
    }

    pg.query('delete from "Cheque" where id = $1',
        [id])
        .then(r=>{
            if (r.rowCount){
                console.log('Удаление успешно');
                res.send({status: true})
            }
            else {
                //console.log('Не удалось удалить запись');
                throw new Error('Запись не найдена');
            }
        })
        .catch(e=>{
            console.error(e);
            if (e.message === 'Запись не найдена'){
                return next(createError(404));
            }
            next(createError(500));
        })
})

module.exports = router;

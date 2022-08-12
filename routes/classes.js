const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select c.id as id, shortname as day, lesson, l.name as location from "Classes" as c inner join "Times" as t on c.time = t.id inner join "Locations" as l on c.location = l.id inner join "Days" as d on c.day = d.id')
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
        || !req.body.day
        || !req.body.time
        || !req.body.location){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Classes" (day, time, location) values ($1, $2, $3) returning id',
        [req.body.day, req.body.time, req.body.location])
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

router.get('/get/one', (req, res, next)=>{
    const id = req.query['id']
    const full = req.query['full']

    if (!id) {
        return next(createError(400, 'inspected id'))
    }

    let sql = null;

    if (full) {sql = 'select * from "Classes" where id = $1'}
    else {sql = 'select c.id as id, shortname as day, lesson, l.name as location from "Classes" as c inner join "Times" as t on c.time = t.id inner join "Locations" as l on c.location = l.id inner join "Days" as d on c.day = d.id where c.id = $1'}

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
        || !body.old.day || !body.new.day
        || !body.old.time || !body.new.time
        || !body.old.location || !body.new.location
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Classes" where id = $1 and day = $2 and time = $3 and location = $4',
        [body.old.id, body.old.day, body.old.time, body.old.location])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Classes" set day = $1, time = $2, location = $3 where id = $4',
                [body.new.day, body.new.time, body.new.location, id])
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

    pg.query('delete from "Classes" where id = $1',
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

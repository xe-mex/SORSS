const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select d.id as id, d.name as name, mail, phone, short, shortname from "Departments" as d join "Institutes" as i on d.institute = i.id')
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
        || !req.body.name
        || !req.body.mail
        || !req.body.phone
        || !req.body.short
        || !req.body.institute){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Departments" (name, mail, phone, short, institute) values ($1, $2, $3, $4, $5) returning id',
        [req.body.name, req.body.mail, req.body.phone, req.body.short, req.body.institute])
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

    if (full) {sql = 'select * from "Departments" where id = $1'}
    else {sql = 'select d.id as id, d.name as name, mail, phone, short, shortname from "Departments" as d join "Institutes" as i on d.institute = i.id where d.id = $1'}

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
        || !body.old.name || !body.new.name
        || !body.old.mail || !body.new.mail
        || !body.old.phone || !body.new.phone
        || !body.old.short || !body.new.short
        || !body.old.institute || !body.new.institute
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Departments" where id = $1 and name = $2 and mail = $3 and phone = $4 and institute = $5 and short = $6',
        [body.old.id, body.old.name, body.old.mail, body.old.phone, body.old.institute, body.old.short])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Departments" set name = $1, mail = $2, phone = $3, institute = $4, short = $5 where id = $6',
                [body.new.name, body.new.mail, body.new.phone, body.new.institute, body.new.short, id])
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

    pg.query('delete from "Departments" where id = $1',
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

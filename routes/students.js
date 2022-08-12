const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select s.id as id, fullname, card, address, passport, authority, phone, g.name as group from "Students" as s join "Groups" as g on s.group = g.id')
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
        || !req.body.fullname
        || !req.body.card
        || !req.body.phone
        || !req.body.address
        || !req.body.passport
        || !req.body.authority
        || !req.body.group){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Students" (fullname, card, phone, address, passport, authority, "group") values ($1, $2, $3, $4, $5, $6, $7) returning id',
        [req.body.fullname, req.body.card, req.body.phone, req.body.address, req.body.passport, req.body.authority, req.body.group])
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

    if (full){sql = 'select * from "Students" where id = $1'}
    else {sql = 'select s.id as id, fullname, card, address, passport, authority, phone, g.name as group from "Students" as s join "Groups" as g on s.group = g.id where s.id = $1'}

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
        || !body.old.fullname || !body.new.fullname
        || !body.old.card || !body.new.card
        || !body.old.phone || !body.new.phone
        || !body.old.address || !body.new.address
        || !body.old.passport || !body.new.passport
        || !body.old.authority || !body.new.authority
        || !body.old.group || !body.new.group
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Students" where id = $1 and fullname = $2 and card = $3 and phone = $4 and address = $5 and passport = $6 and authority = $7 and "group" = $8',
        [body.old.id, body.old.fullname, body.old.card, body.old.phone, body.old.address, body.old.passport, body.old.authority, body.old.group])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Students" set fullname = $1, card = $2, phone = $3, address = $4, passport = $5, authority = $6, "group" = $7 where id = $8',
                [body.new.fullname, body.new.card, body.new.phone, body.new.address, body.new.passport, body.new.authority, body.new.group, id])
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

    pg.query('delete from "Students" where id = $1',
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

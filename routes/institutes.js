const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select * from "Institutes"')
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
        || !req.body.shortname){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Institutes" (name, shortname) values ($1, $2) returning id',
        [req.body.name, req.body.shortname])
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
            // if (e.code === '23505'){
            //     return next(createError(424, 'login not unique'))
            // }
            next(createError(500));
        })
})

router.get('/get/one', (req, res, next)=>{
    const id = req.query['id']

    if (!id) {
        return next(createError(400, 'inspected id'))
    }

    pg.query('select * from "Institutes" where id = $1',
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
        || !body.old.shortname || !body.new.shortname
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Institutes" where id = $1 and name = $2 and shortname = $3',
        [body.old.id, body.old.name, body.old.shortname])
        .then(r=>{
            if (r.rowCount && body.old.id === r.rows[0].id){
                return pg.query('update "Institutes" set name = $1, shortname = $2 where id = $3',
                    [body.new.name, body.new.shortname, body.old.id])
            }
            else {
                throw new Error('404')
            }
        })
        .then(r=>{
            if (r.rowCount){
                console.log('Обновление записи успешно');
                res.send({status: true});
            }
            else {
                throw new Error('404');
            }
        })
        .catch(e=>{
            console.error(e);
            if (e.message === '404'){
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

    pg.query('delete from "Institutes" where id = $1',
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

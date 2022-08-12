const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select * from "Periods"')
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
        || !req.body.start
        || !req.body.end
        || !(req.body.online === true || req.body.online === false)
        || (!req.body.description && req.body.description !== null)
        || req.body.end <= req.body.start){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Periods" ("start", "end", online, description) values ($1, $2, $3, $4) returning id',
        [req.body.start, req.body.end, req.body.online, req.body.description])
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

    if (!id) {
        return next(createError(400, 'inspected id'))
    }

    pg.query('select * from "Periods" where id = $1',
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
        || !body.old.start || !body.new.start
        || !body.old.end || !body.new.end
        || !(body.old.online === true || body.old.online === false)
        || !(body.new.online === true || body.new.online === false)
        || (!body.old.description && body.old.description !== null)
        || (!body.new.description && body.new.description !== null)
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
        || body.new.end <= body.new.start
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Periods" where id = $1 and start = $2 and "end" = $3 and online = $4 and (description = $5 or $5 is null)',
        [body.old.id, body.old.start, body.old.end, body.old.online, body.old.description])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Periods" set start = $1, "end" = $2, online = $3, description = $4 where id = $5',
                [body.new.start, body.new.end, body.new.online, body.new.description, id])
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

    pg.query('delete from "Periods" where id = $1',
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

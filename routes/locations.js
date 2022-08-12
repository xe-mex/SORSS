const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select * from "Locations"')
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
        || !req.body.address
        || !req.body.capacity
        || !(req.body.open === true || req.body.open === false)
        || !(req.body.gym === true || req.body.gym === false)
        || !(req.body.pool === true || req.body.pool === false)
        //req.body.open &&
    ){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Locations" (name, address, capacity, open, gym, pool) values ($1, $2, $3, $4, $5, $6) returning id',
        [req.body.name, req.body.address, req.body.capacity, req.body.open, req.body.gym, req.body.pool])
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

    pg.query('select * from "Locations" where id = $1',
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
        || !body.old.address || !body.new.address
        || !body.old.capacity || !body.new.capacity
        || !(body.old.open === false || body.old.open === true)
        || !(body.old.gym === false || body.old.gym === true)
        || !(body.old.pool === false || body.old.pool === true)
        || !(body.new.open === true || body.new.open === false)
        || !(body.new.gym === true || body.new.gym === false)
        || !(body.new.pool === true || body.new.pool === false)
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Locations" where id = $1 and name = $2 and address = $3 and capacity = $4 and open = $5 and gym = $6 and pool = $7',
        [body.old.id, body.old.name, body.old.address, body.old.capacity, body.old.open, body.old.gym, body.old.pool])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Locations" set name = $1, address = $2, capacity = $3, open = $4, gym = $5, pool = $6 where id = $7',
                [body.new.name, body.new.address, body.new.capacity, body.new.open, body.new.gym, body.new.pool, id])
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

    pg.query('delete from "Locations" where id = $1',
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

const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select * from "Days"')
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

    return next(createError(405));

    // if (!req.body
    //     || !req.body.dayname
    //     || !req.body.shortname){
    //     return next(createError(400, 'syntax error'))
    // }
    //
    // pg.query('insert into "Days" (dayname, shortname) values ($1, $2) returning id',
    //     [req.body.dayname, req.body.shortname])
    //     .then(r=>{
    //         //console.log(r);
    //         if (r.rowCount){
    //             console.log('Добавлена новая запись');
    //             res.send({newId: r.rows[0].id})
    //         }
    //         else throw new Error('Нет записи')
    //     })
    //     .catch(e=>{
    //         console.log(e);
    //         if (e.code === '23503'){
    //             return next(createError(404))
    //         }
    //         next(createError(500));
    //     })
})

router.get('/get/one', (req, res, next)=>{
    const id = req.query['id']

    if (!id) {
        return next(createError(400, 'inspected id'))
    }

    pg.query('select * from "Days" where id = $1',
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
    next(createError(405));
})

router.delete('/delete', (req, res, next)=>{
    next(createError(405))
})

module.exports = router;

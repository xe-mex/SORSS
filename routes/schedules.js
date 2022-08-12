const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    next(createError(405));
    // //res.send('test');
    // pg.query('select d.id as id, d.name as name, mail, phone, short, shortname from "Departments" as d join "Institutes" as i on d.institute = i.id')
    //     .then((r)=>{
    //         //console.log(r.rows);
    //         res.send(r.rows);
    //         //console.log(`Отправлено ${r.rowCount} записей`);
    //         process.stdout.write(`Отправлено ${r.rowCount} записей `);
    //     })
    //     .catch(e=>{
    //         console.error(e);
    //         next(createError(500));
    //     })
})

router.post('/add', express.json(), (req, res, next)=>{
    if (!req.body
        || !req.body.section
        || !req.body.class){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Schedules" (section, class) values ($1, $2) returning section, class',
        [req.body.section, req.body.class])
        .then(r=>{
            //console.log(r);
            if (r.rowCount){
                console.log('Добавлена новая запись');
                res.send({
                    newSection: r.rows[0].section,
                    newClass: r.rows[0].class
                })
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

router.get('/get/classes', (req, res, next)=>{
    const id = req.query['section']
    const full = req.query['full']

    if (!id) {
        return next(createError(400, 'inspected section id'))
    }

    let sql = null;

    if (full) {sql = 'select * from "Classes" where id in (select class from "Schedules" where section = $1)'}
    else {sql = 'select c.id as id, shortname as day, lesson, l.name as location from "Classes" as c inner join "Times" as t on c.time = t.id inner join "Locations" as l on c.location = l.id inner join "Days" as d on c.day = d.id where c.id in (select class from "Schedules" where section = $1)'}

    pg.query(sql,
        [id])
        .then(r=>{
            if (r.rowCount){
                console.log(`Отправлено ${r.rowCount} записей`)
                res.send(r.rows)
            }
            else {
                console.log('Записи не найдены')
                next(createError(404))
            }
        })
        .catch(e=>{
            console.error(e)
            next(createError(500));
        })
})

router.get('/get/sections', (req, res, next)=>{
    const id = req.query['class']
    const full = req.query['full']

    if (!id) {
        return next(createError(400, 'inspected class id'))
    }

    let sql = null;

    if (full) {sql = 'select * from "Sections" where id in (select class from "Schedules" where class = $1)'}
    else {sql = 'select s.id as id, s.name as name, e.fullname as teacher from "Sections" as s inner join "Periods" as p on s.period = p.id inner join "Employees" as e on s.teacher = e.id where s.id in (select class from "Schedules" where class = $1)'}

    pg.query(sql,
        [id])
        .then(r=>{
            if (r.rowCount){
                console.log(`Отправлено ${r.rowCount} записей`)
                res.send(r.rows)
            }
            else {
                console.log('Записи не найдены')
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
        || !body.old.class || !body.new.class
        || !body.old.section || !body.new.section
    ) {
        return next(createError(400));
    }

    pg.query('update "Schedules" set class = $1, section = $2 where class = $3 and section = $4',
        [body.new.class, body.new.section, body.old.class, body.old.section])
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
            if (e.message === '404' || e.code === '23503'){
                return next(createError(404));
            }
            else next(createError(500));
        })
})

router.delete('/delete', (req, res, next)=>{
    const section = req.query['section'];
    const class_ = req.query['class'];

    if (!section || !class_) {
        console.log('Пустой запрос на удаление');
        return next(createError(400));
    }

    pg.query('delete from "Schedules" where section = $1 and class = $2',
        [section, class_])
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

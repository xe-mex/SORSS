const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    //res.send('test');
    pg.query('select * from "Employees"')
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

router.post('/login', express.json(), (req, res, next)=>{
    if (!req.body
        || !req.body.login
        || !req.body.password){
        return next(createError(400, 'Syntax error'));
    }

    pg.query('select login, id from "Employees" where login = $1 and password = $2',
        [req.body.login, req.body.password])
        .then((r)=>{
            //console.log(r);
            const login = r.rows[0]?.login;
            const id = r.rows[0]?.id;
            if (r.rowCount){
                req.session.login = login;
                req.session.employeeId = id;
                console.log(`Пользователь вошёл под ${login} : id = ${id}`)
                res.send({login:login});
            }
            else {
                return next(createError(404));
            }
        })
        .catch(e=>{
            console.error(e);
            next(createError(500))
        })
})

router.post('/registration', express.json(), (req, res, next)=>{
    if (!req.body
        || !req.body['fullname']
        || !req.body.post
        || !req.body.login
        || !req.body.password){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Employees" (department, fullname, post, login, password) values ($1, $2, $3, $4, $5) returning login',
        [5, req.body['fullname'], req.body.post, req.body.login, req.body.password])
        .then(r=>{
            //console.log(r);
            if (r.rowCount){
                console.log('Добавлена новая запись');
                res.send({newLogin: r.rows[0].login})
            }
            else throw new Error('Нет записи')
        })
        .catch(e=>{
            console.log(e);
            if (e.code === '23505'){
                return next(createError(424, 'login not unique'))
            }
            next(createError(500));
        })
})

router.get('/get/one', (req, res, next)=>{
    const login = req.query['login']

    if (!login) {
        return next(createError(400, 'inspected login'))
    }

    pg.query('select id, fullname, post, login from "Employees" where login = $1',
        [login])
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
        || !body.old.login || !body.new.login
        || !body.old.password || !body.new.password
        || !body.old.fullname || !body.new.fullname
        || !body.old.post || !body.new.post
        || body.old.login !== body.new.login
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Employees" where login = $1 and password = $2 and fullname = $3 and post = $4',
        [body.old.login, body.old.password, body.old.fullname, body.old.post])
        .then(r=>{
            if (r.rowCount){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Employees" set fullname = $1, password = $2, post = $3 where id = $4',
                [body.new.fullname, body.new.password, body.new.post, id])
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
            if (e.message === '404'){
                next(createError(404));
            }
            else next(createError(500));
        })
})

router.delete('/delete', (req, res, next)=>{
    const login = req.query['login'];

    if (!login) {
        console.log('Пустой запрос на удаление');
        return next(createError(400));
    }

    pg.query('delete from "Employees" where login = $1',
        [login])
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

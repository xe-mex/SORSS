const express = require("express")
    ,router = express.Router()
    ,pg = require('../utils/postgres')
    ,createError = require("http-errors")

router.get('/get/all', (req, res, next)=>{
    const actual = req.query['actual'];
    const withoutCheque = req.query['withoutCheque']

    let sql = 'select cn.id as id, cn.number as number, (select ch.number from "Cheque" ch where ch.contract = cn.id) as "chequeNumber", (select confirm from "Cheque" ch where ch.contract = cn.id) as confirm, st.fullname as student, em.fullname as employee, se.name as section, gr.name as group, cn."countClasses" as "countClasses" from "Contracts" cn inner join "Students" as st on cn.student = st.id inner join "Employees" as em on cn.employee = em.id inner join "Sections" as se on cn.section = se.id inner join "Groups" as gr on st.group = gr.id'

    if (actual){
        sql += ' inner join "Periods" as pe on se.period = pe.id where (now() between start and "end")'
    }

    if (withoutCheque){
        if (!actual){
            sql += ' where';
        }
        else {
            sql+=' and';
        }
        sql += ' (cn.id not in (select contract from "Cheque"))'

    }
    //res.send('test');
    //console.log(sql);
    pg.query(sql)
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
        || !req.body.countClasses
        || !req.body.number
        //|| !req.body.cheque
        || !req.body.student
        || !req.body.section){
        return next(createError(400, 'syntax error'))
    }

    pg.query('insert into "Contracts" ("countClasses", number, student, section, employee) values ($1, $2, $3, $4, $5) returning id',
        [req.body.countClasses, req.body.number, req.body.student, req.body.section, req.session.employeeId])
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

    if (full) {sql = 'select cn.id as "contractId", "countClasses", cn.number as "contractNumber", (select ch.id from "Cheque" ch where ch.contract = cn.id) as "chequeId", (select ch.date from "Cheque" ch where ch.contract = cn.id) as "chequeDate", (select ch.online from "Cheque" ch where ch.contract = cn.id) as "chequeOnline", (select ch.number from "Cheque" ch where ch.contract = cn.id) as "chequeNumber", (select ch.total from "Cheque" ch where ch.contract = cn.id) as "chequeTotal", (select ch.confirm from "Cheque" ch where ch.contract = cn.id) as "chequeConfirm", st.id as "studentId", st.fullname as "studentName", st.group as "groupId", gr.name as "groupName", em.id as "employeeId", em.fullname as "employeeName", em.post as "post", se.id as "sectionId", se.name as "sectionName", se.teacher as "sectionTeacher", pe.id as "periodId", pe."start" as "periodStart", pe."end" as "periodEnd", pe.online as "periodOnline", pe.description as "periodDescription", emp.fullname as teacher from "Contracts" cn inner join "Students" as st on cn.student = st.id inner join "Employees" as em on cn.employee = em.id inner join "Sections" as se on cn.section = se.id inner join "Groups" as gr on st.group = gr.id inner join "Periods" as pe on se.period = pe.id inner join "Employees" as emp on se.teacher = emp.id where cn.id = $1'}

    else {sql = 'select cn.id as id, cn.number as number, (select ch.number from "Cheque" ch where ch.contract = cn.id) as "chequeNumber", (select confirm from "Cheque" ch where ch.contract = cn.id) as confirm, st.fullname as student, em.fullname as employee, se.name as section, gr.name as group, "countClasses", "start", "end" from "Contracts" cn inner join "Students" as st on cn.student = st.id inner join "Employees" as em on cn.employee = em.id inner join "Sections" as se on cn.section = se.id inner join "Groups" as gr on st.group = gr.id inner join "Periods" as pe on se.period = pe.id where cn.id = $1'}

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
        || !body.old.countClasses || !body.new.countClasses
        || !body.old.number || !body.new.number
        || !body.old.student || !body.new.student
        || !body.old.section || !body.new.section
        || !body.old.id || !body.new.id
        || body.old.id !== body.new.id
    ) {
        return next(createError(400));
    }

    pg.query('select id from "Contracts" where id = $1 and "countClasses" = $2 and number = $3 and student = $5 and section = $6',
        [body.old.id, body.old.countClasses, body.old.number, body.old.student, body.old.section])
        .then(r=>{
            if (r.rowCount && r.rows[0].id === body.old.id){
                return r.rows[0].id;
            }
            else throw new Error('404');
        })
        .then(id=>{
            return pg.query('update "Contracts" set "countClasses" = $1, number = $2, student = $3, section = $4 where id = $5',
                [body.new.countClasses, body.new.number, body.new.student, body.new.section, id])
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

    pg.query('delete from "Contracts" where id = $1',
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

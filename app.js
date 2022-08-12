const express = require("express")
    , logger = require('morgan')
    , {createClient} = require("redis")
    , session = require("express-session")
    , redisStorage = require("connect-redis")(session)
    , redisClient = createClient({legacyMode: true})
    , https = require("https")
    , fs = require("fs")
    , createError = require('http-errors')
    , cors = require("cors")

const app = express();

// app.use((req, res, next)=>{
//     console.log(req.url)
//     next();
// })

const corsOptions = {
    origin: 'http://localhost:4200',
    credentials: true
}

app.use(cors(corsOptions))

app.use(session({
    store: new redisStorage({
        host: 'localhost',
        port: 6379,
        client: redisClient
    }),
    name: 'session',
    secret: 'secret',
    saveUninitialized: false,
    resave: false,
    rolling: true,
    cookie: {
        maxAge: (1000 * 60 * 60 * 2), //2 часа
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        path: '/'
    }
}))

app.use(logger('dev'))

//Проверка сессии
app.use('/api',(req, res, next)=>{
    //console.log(req.session);

    req.session.key = req.session.key ?? req.sessionID;
    if ((!req.session.login || !req.session.employeeId) && req.url !== '/admins/login'){
        console.log('Пользователь не аутентифицирован')
        return next(createError(401, 'Not auth'));
    }
    //console.log(req.session.employeeId);
    process.stdout.write(req.session.login+': ')
    next();
})

const indexRouter = require("./routes/index")
    , employerRouter = require("./routes/admins")
    , instituteRouter = require("./routes/institutes")
    , departmentRouter = require("./routes/departments")
    , groupsRouter = require("./routes/group")
    , studentRouter = require("./routes/students")
    , locationRouter = require("./routes/locations")
    , periodRouter = require("./routes/periods")
    , dayRouter = require("./routes/days")
    , timeRouter = require("./routes/times")
    , chequeRouter = require("./routes/cheque")
    , classRouter = require("./routes/classes")
    , sectionRouter = require("./routes/sections")
    , scheduleRouter = require("./routes/schedules")
    , contractRouter = require("./routes/contracts")

app.use('/api/', indexRouter)
app.use('/api/admins', employerRouter)
app.use('/api/institutes', instituteRouter)
app.use('/api/departments', departmentRouter)
app.use('/api/groups', groupsRouter)
app.use('/api/students', studentRouter)
app.use('/api/locations', locationRouter)
app.use('/api/periods', periodRouter)
app.use('/api/days', dayRouter)
app.use('/api/times', timeRouter)
app.use('/api/cheque', chequeRouter)
app.use('/api/classes', classRouter)
app.use('/api/sections', sectionRouter)
app.use('/api/schedules', scheduleRouter)
app.use('/api/contracts', contractRouter)

//Обработка ошибок
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    //res.render('error');
    res.send(err.message || 'unknown error');
});

const key = fs.readFileSync("localhostdns.key")
    , cert = fs.readFileSync("localhostdns.crt")
    , server = https.createServer({key, cert}, app)

server.listen(3000, ()=>{
    redisClient.connect()
        .catch(e=>{
            console.error(e);
        })
        .then(()=>{
            console.log('Сервер запущен на https:3000');
        })
})

const express = require("express")
    ,router = express.Router();

router.use(express.static(__dirname));

router.get("/", (req, res, next)=>{
    res.send('yyyyeees');
})

module.exports = router;

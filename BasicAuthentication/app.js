var express = require('express')
var app = express()

app.get('/', function (req, res, next) {
  res.send('Hello World!')
})

app.get('/authentication', function (req, res, next) {
  if (!req.headers.authorization) {
    res.set({
      'WWW-Authenticate': 'Basic realm = "deng"'
    })
    res.status(401).end()
  }
  else {
    console.log(req.headers)
    console.log(req.headers.authorization)
    var base64 = req.headers.authorization.split(" ")[1]
    var userPass = new Buffer(base64, 'base64').toString().split(":")
    var user = userPass[0]
    var password = userPass[1]
    if (user == "deng" && password == "deng") {
      res.end("Hello Mr.Deng")
    }
    else {
      res.status(401).end()
    }
  }
})

app.listen(3000, function () {
  console.log('Server listening on port 3000!')
})
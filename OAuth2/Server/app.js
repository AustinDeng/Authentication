let express = require('express')
let app = express()

function extendAPIOutput(req, res, next) {

  // 响应 API 成功结果
  res.apiSuccess = function(data) {
    res.json({
      status: 'OK',
      result: data
    })
  }

  /**
   * 响应 API 错误结果
   * err 包含两个属性: error_code 和 erroe_message
   */
  res.apiError = function(err) {
    res.json({
      status: 'Error',
      error_code: err.error_code || 'UNKNOWN',
      error_message: err.error_message || err.toString()
    })
  }

  next()
}

app.use(extendAPIOutput)

// 返回 err 作为 res.apiError 的参数
function createApiError(code, msg) {
  let err = new Error(msg)
  err.error_code = code
  err.error_message = msg
  
  return err;
}

// 直接将回调函数的 err 对象响应给客户端
function callback(err, ret) {
  if (err) return res.apiError(err)
  
  // next...
}

function apiErrorHandle(err, req, res, next) {
  // 如果存在 res.apiError() 则使用其来输出错误消息
  if (typeof res.apiError === 'function') {
    return res.apiError(err)
  }

  next()
}

app.use(apiErrorHandle)

function ensureLogin(req, res, next) {
  // 先检查用户是否已经登录
  // 如果未登录则跳转到登录界面
  // 如果已经登录, 则记录用户相关信息
  req.loginUserId = 123
  
  next()
}

// 检验跳转到登录界面时,是否包含了 client_id 和 redirect_id 两个参数
function missParameterError(name) {
  return createApiError('MISSING_PARAMETER', '缺少参数`' + name + '`')
}

function redirectUriNotMatcher(url) {
  return createApiError('REDIRECT_URI_NOT_MATCH', '回调地址不正确' + url)
}

function checkAuthorizeParams(req, res, next) {
  // 校验参数
  if (!req.query.client_id) {
    return next(missParameterError('client_id'))
  }
  if(!req.query.redirect_uri) {
    return next(missParameterError('redirect_uri'))
  }

  // 检验 client_id 是否正确, 并查询应用的相关信息
  getAppInfo(req.query.client_id, function(err, ret) {
    if (err) return next(err)

    req.appInfo = ret

    verifyAppRedirectUri(req.query.client_id, req.query.redirect_uri, function(err, ok){
      if(err) return next(err)
      if(!OK) {
        return next(redirectUriNotMatcher(req.query.redirect_uri))
      }

      next()
    })
  })
}

// 请求用户授权界面
app.get('OAuth2/authorize', ensureLogin, checkAuthorizeParams, function(req, res, next) {
  res.locals.loginUserId = req.loginUserId
  res.locals.appInfo = req.appInfo
  res.render('authorize')
})

const parseUrl = require('url').parse
const formatUrl = require('url').format

// 在 URL 中增加一些参数, 并返回给新的 URL
function addQueryParamsToUrl(url, params) {
  let info = parseUrl(url, true)

  for (let i in params) {
    info.query[i] = params[i]
  }

  delete info.search

  return formatUrl(info)
}

// 用于生成唯一的 authorization_code, 这个 code 可以找到对应的用户和请求的授权应用, 会在 access_token 时校验
function randomString(size, chars) {
  size = size || 6
  let condingString = chars || 'ABCDEFGHIJKLMNOPQRTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let maxNum = condingString.length + 1
  let newPass = ''

  while(size > 0) {
    newPass += condingString.charAt(Math.floor(Math.random() * maxNum))
    size--
  }

  return newPass
}

function generateAuthorizationCode(userId, appKey, redirectUri, callback) {
  // 生成 code
  let code = randomString(20)

  // 将 code userId appKey redirectUri 存储到数据库中

  callback(null, code)
}

app.post('OAuth2/authorize', ensureLogin, checkAuthorizeParams, function(req, res,next){
  // 生成 authorization_code
  generateAuthorizationCode(req.loginUserId, req.query.client_id, req.query.redirect_uri, function(err, ret) {
    if (err) return next(err)

    // 跳转至源应用
    res.redirect(addQueryParamsToUrl(req.query.redirect_uri,{
      code: ret
    }))
  })
})

// 应用申请到了 authorization_code 之后
// 通过该接口获取 access_token
app.post('/OAuth2/access_token', function(req, res, next){
  // 检验参数
  let client_id = req.body.client_id || req.query.client_id
  let client_secret = req.body.client_secret || req.query.client_secret
  let redirect_uri = req.body.redirect_uri || req.query.redirect_uri
  let code = req.body.code || req.query.code

  if (!client_id) return next(missParameterError('client_id'))
  if (!client_secret) return next(missParameterError('client_secret'))
  if (!redirect_uri) return next(missParameterError('redirect_uri'))
  if (!code) return next(missParameterError('code'))

  // 验证 authorization_code
  verifyAuthorizationCode(code, client_id, client_secret, redirect_uri, function(err, userId){
    if(err) return next(err)
    
    // 生成 access_token
    generateAccessToken(userId, client_id, function(err, accessToken) {
      if(err) return next(err)

      // 生成 access_token 后要删除旧的 authorization_code
      deleteAuthorizationCode(code, function(err) {
        if(err) return next(err)
      })

      res.apiSuccess({
        access_token: accessToken,
        expires_in: 3600 * 24 // access_token 有效时间是一天
      })

    })
  })

})

function verifyAuthorizationCode(code, appKey, appSecret, redirectUri, callback) {
  
  // 从数据库中查找对应的 code 记录
  // 校验 appKey appSecret 和 redirectUri

  // userId 为该 code 对应的 userId
  callback(null, userId)
}

// 获取秒时间戳
function getTimestamp() {
  return parseInt(Data.now() / 1000, 10)
}

// 生成 Access Token 
// expires 表示 token 的有效期
function generateAccessToken(userId, appKey, expires, callback) {
  // 生成 code
  let code = randomString(20) + '.' + (getTimestamp() + expires)

  // 将 code userId appKey 存到数据库
  // ...

  callback(null, code)
}

function deleteAuthorizationCode(code, callback) {
  // 从数据集中删除对应的 code 记录
  // ...

  callback(null, code)
}

/*************
 * 至此 OAuth 授权流程全部完成
 *************/

function invalidParameterError(name) {
  return createApiError('INVALID_PARAMETER', '参数`' + name + '`不正确')
}

// 从 access_token 中取出时间戳
function getTimestampFromAccessToken(token) {
  return Number(token.split('.').pop())
}

// access_token 过期时,返回错误
function accessTokenExpiredError() {
  return createApiError('ACCESS_TOKEN_EXPIRED', 'access_token expired')
}

function getAccessTokenInfo(token, callback) {
  // 查询数据库中对应的 token 信息

  callback(null, info)
}

function verifyAccessToken(req, res, next) {
  let accessToken = (req.body && req.body.access_token) || req.query.access_token
  let source = (req.body && req.body.source) || req.query.source

  // 检查参数
  if(!accessToken) return next(missParameterError('access_token'))
  if(!source) return next(missParameterError('source'))

  // 验证 access_token 是否过期
  if (getTimestamp() > getTimestampFromAccessToken(accessToken)) {
    return next(accessTokenExpiredError())
  }

  // 查询 access_token 的信息
  database.getAccessTokenInfo(accessToken, function(err, tokenInfo) {
    if(err) return next(err)

    // 检查 appKey 是否一致
    if (source !== tokenInfo.clientId) {
      return next(invalidParameterError('source'))
    }

    // 保存当前 access_token 的详细信息
    req.accessTokenInfo = tokenInfo

    next()

  })
}

// app.use('/api', verifyAccessToken)
app.get('/api/v1/articles.json', verifyAccessToken, function(req, res, next) {
  // 处理 API 请求
  // ...
})



app.get('/', function(req, res) {
  res.send('Hello, World!')
})

app.listen('3000', function(req, res) {
  console.log('Listining on 3000.')
})

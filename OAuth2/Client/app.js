function APIClient(options) {
  this._appKey = options.appKey
  this._appSecret = options.appSecret
  this._callbackUrl = options.callbackUrl
  this._accessToken = options.accessToken
}

let request = require('request')

// 定义请求 API 地址
let API_URL = 'http://example.com'
let API_OAUTH2_AUTHORIZE = API_URL + '/OAuth2/authorize'
let API_OAUTH2_ACCESS_TOKEN = API_URL + '/OAuth2/access_token'

// 生成获取授权的跳转地址
APIClient.prototype.getRedirectUrl = function() {
  return addQueryParamsToUrl(API_OAUTH2_AUTHORIZE, {
    client_id: this.appKey,
    redirect_uri: this._callbackUrl
  })
}

// 发送请求
APIClient.prototype._request = function(method, url, params, callback) {
  method = method.toUpperCase()

  // 如果已经获取了 access_token 则加上 source 和 access_token 两个参数
  if(this._accessToken) {
    params.source = this._appKey
    params.access_token = this._accessToken
  }

  // 根据不同的请求方法 生成用于 request 模块的参数
  let requestParams = {
    method: method,
    url: url
  }
  if(method === 'GET' || method === 'HEAD') {
    requestParams.qs = params
  } else {
    requestParams.formData = params
  }

  request(requestParams, function(err, res, body) {
    if(err) return callback(err)

    // 解析返回的数据
    try {
      let data = JSON.parse(body.toString())
    } catch(err) {
      return callback(err)
    }

    // 判断是否出错
    if(data.status !== 'OK') {
      return callback({
        code: data.error_code,
        message: data.error_message
      })
    }

    callback(null, data.result)

  })
}

// 获取 access_token
APIClient.prototype.requestAccessToken = function(code, callback) {
  let me = this
  this._request('post', API_OAUTH2_ACCESS_TOKEN, {
    code: code,
    client_id: this._appKey,
    client_secret: this._appSecret,
    redirect_uri: this._callbackUrl
  }, function(err, ret) {
    // 请求成功, 则保存获取的 access_token
    if(ret) me._accessToken = ret.access_token
    callback(err, ret)
  })
}

// 在 URL 中增加一些参数, 并返回给新的 URL
function addQueryParamsToUrl(url, params) {
  let info = parseUrl(url, true)

  for (let i in params) {
    info.query[i] = params[i]
  }

  delete info.search

  return formatUrl(info)
}

let express = require(express)
let app = express()
app.get('/auth/callback', function(req, res, next) {
  client.requestAccessToken(req.query.code, function(err, ret) {
    if(err) return next(err)

    // ret.access_token 即为获取到的授权码

    // 显示授权成功页面
    res.end('获取授权成功')

  })
})

// 实现查询所有文章
let API_ARTICLES = API_URL + '/api/v1/articles'
APIClient.prototype.getArticle = function(params, callback) {
  this._request('get', API_ARTICLES, params, callback)
}

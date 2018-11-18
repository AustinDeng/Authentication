# Authentication

几种常用的前后端鉴权方式

- [x] HTTP Basic Authentication
- [ ] session-cookie
- [ ] Token 验证
- [x] OAuth2
- [ ] JSON Web Token

## HTTP Basic Authentication

在HTTP中，基本认证（Basic access authentication）是一种用来允许网页浏览器或其他客户端程序在请求时提供用户名和口令形式的身份凭证的一种登录验证方式。

### 认证流程

1. 客户端向服务器端发送请求

    Get /authentication HTTP/1.0 
    Host:localhost.com:3000
    
2. 服务器端判断该请求是否被验证,若没有验证,则向客户端发送验证请求代码`401`

    HTTP/1.0 401 Unauthorised 
    Server: SokEvo/1.0 
    WWW-Authenticate: Basic realm="deng.com" 
    Content-Type: text/html 
    Content-Length: xxx

3. 客户端收到 401 验证请求,弹出登录窗口, 要求用户输入用户名和密码

4. 用户输入完用户名和密码之后,客户端将其以BASE64的方式加密并发送给服务器端

5. 服务器端收到客户端的信息后,取出Authorization字段信息,并进行解密校验,若用户名及密码匹对正确,则返回资源给客户端

## OAuth2

[一篇通俗易懂的文章](http://www.10tiao.com/html/151/201707/2665513744/1.html)

### 授权流程

![1.jpg](https://i.loli.net/2018/11/18/5bf112ff6f3f0.jpg)

（A）用户打开客户端以后，客户端要求用户给予授权。

（B）用户同意给予客户端授权。

（C）客户端使用上一步获得的授权，向认证服务器申请令牌。

（D）认证服务器对客户端进行认证以后，确认无误，同意发放令牌。

（E）客户端使用令牌，向资源服务器申请获取资源。

（F）资源服务器确认令牌无误，同意向客户端开放资源。

### 具体流程

1. 引导需要授权的用户到 Web 授权页面:  
https://example.com/oauth2/authorize?client_id=CLIENT_ID&response_type=code&redirect_uri=REDIRECT_URI

    - `https://example.com/oauth2/authorize` 为 API 服务提供方的授权页面
    - CLIENT_ID 为 API 提供方给当前应用分配的 app_key
    - response_type=code 为返回的授权码类型
    - redirect_uri=REDIRECT_URI 为授权成功后的回调地址

2. 如果用户同意授权,则页面跳转至 `REGISTERED_REDIRECT_URL/?code=CODE`, 生成用于获取 `access_token` 的 `authorization_code`

3. 应用接收第二步中回调的 code 之后,请求一下地址获取 `access_token`: https://example.com/oauth2/access_token?client_id=CLIENT_ID&client_secret=CLIENT_SECRET&grant_type=authorization_code&redirect_uri=REGISTERED_REDIRECT_URI&code=CODE

    - CLIENT_ID 为服务器提供方为当前应用分配的 app_key,用它来唯一标识某个应用,一般不可变
    - CLIENT_SECRET 为当前应用对应的 app_secret,用它和 app_key 来确定应用的身份
    - REGISTERED_REDIRECT_URI 为当前用于接收 authorization_code 的回调地址,基于安全的考虑,API服务提供方应该校验此值
    - grant_type=authorization_code用来换取 access_token 的 code 的类型
    - code=CODE 为 API 服务提供方回调时传过来的 authorization_code
    
4. 获取到 access_token 后,使用获得的 OAth 2.0 Access Token 调用 API,在请求 API 时一般需要带上以下两个参数
    
    - source 当前应用的 app_key
    - access_token 第三步获取到的 access_token

### 一般的接口文档

    OAuth2/authorize        ------->     请求用户授权 Token
    OAuth2/access_token     ------->     获取授权过的 Access Token
    OAuth2/get_token_info   ------->     授权信息查询接口
    OAuth2/revokeoath2      ------->     授权回收接口
    
其中 OAuth2/authorize 和 OAuth2/access_token 是必须的,OAuth2/get_token_info 和 OAuth2/revokeoath2 是额外接口,分别用于查询当前 access_token 的信息和回收授权



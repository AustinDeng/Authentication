let faker = require('faker')

// 设置语言为简体中文
faker.locale = 'zh_CN'

let dataArticles = []
let ARTICLE_NUM = 100

// 生成文章列表
for(let i = 0; i < ARTICLE_NUM; i++) {
  dataArticles.push({
    id: faker.random.uuid(),
    author: faker.name.findName(),
    title: faker.lorem.sentence(),
    createAt: faker.date.past(),
    content: faker.lorem.paragraphs(10)
  })
}

function defaultNumber(n, d) {
  n = Number(n)
  return n > 0 ? n : d
}

// 查询文章列表函数
function queryArticles(query, callback) {
  query.$skip = defaultNumber(query.$skip, 0)
  query.$limit = defaultNumber(query.$limit, 10)
  // 返回指定范围的文章数据
  callback(null. dataArticles.slice(query.$skip, query.$skip + query.$limit))
}

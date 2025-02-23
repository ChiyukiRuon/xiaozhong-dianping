# 小众点评 - 后端

毕业设计

---

## 环境变量说明

| 变量名              | 描述                  | 默认值          |
|------------------|---------------------|--------------|
| `CDN_PREFIX`     | CDN 前缀 URL。         | -            |
| `DB_HOST`        | 数据库主机地址。            | -            |
| `DB_NAME`        | 数据库名称。              | -            |
| `DB_PORT`        | 数据库端口。              | `3306`       |
| `DB_USER`        | 数据库用户名。             | -            |
| `DB_PASSWORD`    | 数据库密码。              | -            |
| `EMAIL_ACCOUNT`  | 发送邮件的邮箱账号。          | -            |
| `EMAIL_PASSWORD` | 邮箱账户的密码。            | -            |
| `JWT_SECRET_KEY` | 用于生成 JWT Token 的密钥。 | `secret_key` |
| `QINIU_AK`       | 七牛云 Access Key。     | -            |
| `QINIU_BUCKET`   | 七牛云存储桶名称。           | -            |
| `QINIU_SK`       | 七牛云 Secret Key。     | -            |

## API 文档

详见 [dianping.openapi.json](/docs/dianping.openapi.json)

## 数据表结构

详见 [dianpng.sql](/docs/dianping.sql)

## 运行

`node server.js`

> [!NOTE]
> 管理员需要在数据库中手动创建

## LICENSE

[MIT LICENSE](/LICENSE)

---

[前端](https://github.com/ChiyukiRuon/xiaozhong-dianping-web)
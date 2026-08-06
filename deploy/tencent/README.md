# 腾讯云部署说明

本目录用于把婚礼请柬部署到腾讯云 CloudBase。

## 当前项目对应关系

- 前端静态页面：`public/invitation`
- 后端云函数：`deploy/tencent/functions/weddingApi`
- 腾讯云函数名：`weddingApiHttp`
- 数据库集合：`blessings`、`blessing_replies`、`seating_guests`
- CloudBase 环境 ID：`wedding-invitation-d8cw19676945d`

## 第一次部署

1. 安装并登录 CloudBase CLI。

```powershell
npm install -g @cloudbase/cli
tcb login
```

2. 部署后端 HTTP 云函数。

```powershell
tcb fn deploy weddingApiHttp --dir deploy/tencent/functions/weddingApi -e wedding-invitation-d8cw19676945d --force --httpFn
```

这个命令只部署函数本体。HTTP 访问服务需要在控制台手动创建一次：

```text
/wedding-api
```

前端当前使用完整接口地址：`https://wedding-invitation-d8cw19676945d-1463852299.ap-shanghai.app.tcloudbase.com/wedding-api/wishes` 和 `https://wedding-invitation-d8cw19676945d-1463852299.ap-shanghai.app.tcloudbase.com/wedding-api/seats`。

4. 部署前端静态页面。

```powershell
tcb hosting deploy public/invitation -e wedding-invitation-d8cw19676945d
```

5. 查看静态网站访问地址。

```powershell
tcb hosting detail -e wedding-invitation-d8cw19676945d
```

## 一键部署

也可以在项目根目录运行：

```powershell
.\deploy\tencent\deploy.cmd
```

脚本会依次推送 Gitee、部署云函数、部署静态页面、显示静态网站访问地址。

## 数据如何删除

进入腾讯云 CloudBase 控制台：

1. 选择环境 `wedding-invitation-d8cw19676945d`
2. 打开「文档型数据库」
3. 删除祝福：进入 `blessings` 集合，删除对应记录
4. 删除回复：进入 `blessing_replies` 集合，删除对应记录
5. 修改座位：进入 `seating_guests` 集合，编辑或删除对应宾客

删除一条祝福时，如果它下面有回复，需要同时删除 `blessing_replies` 里 `blessingId` 等于这条祝福 `_id` 的回复。

## 座位数据格式

后续批量导入宾客名单时，每条记录建议是：

```json
{
  "_id": "guest-001",
  "id": "guest-001",
  "name": "胡阳",
  "normalizedName": "胡阳",
  "invitationCode": "728416",
  "table": "A01",
  "seatNote": "朋友席",
  "createdAt": "2026-08-06T00:00:00.000Z"
}
```

`normalizedName` 是去掉空格后的姓名，邀请码统一用 6 位数字或字母。

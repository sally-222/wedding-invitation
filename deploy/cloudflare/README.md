# Cloudflare + GitHub 部署流程

这套流程替代之前的阿里云/腾讯云方案：

- GitHub 托管代码
- Cloudflare Pages 托管网页
- Cloudflare Pages Functions/Workers 处理 `/api` 接口
- Cloudflare D1 保存祝福、回复和座位数据
- GitHub `main` 分支一推送，Cloudflare 自动构建发布

## 1. 准备 GitHub 仓库

在 GitHub 新建一个仓库，建议仓库名：

```text
wedding-invitation
```

把仓库 HTTPS 地址发给我，或者你自己在项目目录执行：

```powershell
git remote add github https://github.com/你的用户名/wedding-invitation.git
git push -u github main
```

如果已经添加过 `github` 远程地址，用：

```powershell
git remote set-url github https://github.com/你的用户名/wedding-invitation.git
git push -u github main
```

## 2. 创建 Cloudflare Pages 项目

进入 Cloudflare 后台：

```text
Workers & Pages -> Create application -> Pages -> Connect to Git
```

选择刚才的 GitHub 仓库，然后填写：

```text
Project name: wedding-invitation
Production branch: main
Framework preset: None
Build command: npm run build:cloudflare-pages
Build output directory: dist/client
Root directory: 留空
```

环境变量里添加：

```text
NODE_VERSION=22
```

创建完成后，每次 `git push github main` 都会触发自动构建。

## 3. 创建并绑定 D1 数据库

进入 Cloudflare 后台：

```text
Storage & Databases -> D1 SQL Database -> Create
```

建议数据库名：

```text
wedding-invitation-db
```

创建后，回到 Pages 项目：

```text
Workers & Pages -> wedding-invitation -> Settings -> Bindings
```

分别给 Production 和 Preview 添加 D1 绑定：

```text
Variable name: DB
D1 database: wedding-invitation-db
```

保存后重新部署一次 Pages。祝福、回复和座位表会在首次访问 API 时自动创建。

## 4. 绑定自定义域名

如果你的域名已经在 Cloudflare 管理：

```text
Workers & Pages -> wedding-invitation -> Custom domains -> Set up a domain
```

填写你的正式域名，例如：

```text
wedding.example.com
```

如果域名还不在 Cloudflare，需要先把域名的 DNS 服务器切到 Cloudflare。Cloudflare 会给你两个 nameserver，在域名购买平台里替换。

域名绑定成功后，把正式域名发给我，我会把网页里的分享链接和缩略图地址从 `wedding-invitation.pages.dev` 改成你的正式域名。

## 5. 数据在哪里删

祝福和回复在 D1 里：

```text
blessings
blessing_replies
```

座位数据在：

```text
seating_guests
```

手动删除某条祝福时，如果要连同回复一起删，先删 `blessing_replies` 里对应 `blessing_id` 的回复，再删 `blessings` 里的祝福。

## 6. 常见问题

如果页面显示数据库未连接，检查 Pages 项目里 D1 绑定名是否 exactly 是：

```text
DB
```

如果部署成功但分享图还是旧域名，说明还没把正式域名同步进 `public/invitation/index.html` 和 `public/invitation/config.js`。

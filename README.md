# 微信点单小程序

可直接用桌面版微信开发者工具导入目录 `C:\Users\z\Documents\微信小程序制作`。

## 当前能力

- 顾客端：浏览菜单、搜索、分类筛选、查看菜品详情、加入购物车、备注下单、查看历史订单
- 商家端：经营看板、订单推进、菜单改价、上下架、修改菜品说明、上传菜品图片
- 图片资源：基于桌面 `菜单.txt` 为 99 道菜生成本地默认图，商家端可继续替换成真实图片
- 数据策略：云开发优先，本地缓存兜底；没填云环境也能直接演示
- 网页版：`web/` 目录下提供顾客页、商家页、分享页，可直接做链接和二维码展示

## 网页分享版

- 顾客页：[web/index.html](C:\Users\z\Documents\微信小程序制作\web\index.html)
- 商家页：[web/merchant.html](C:\Users\z\Documents\微信小程序制作\web\merchant.html)
- 分享页：[web/share.html](C:\Users\z\Documents\微信小程序制作\web\share.html)
- 网页菜单数据由 [scripts/export_web_data.js](C:\Users\z\Documents\微信小程序制作\scripts\export_web_data.js) 导出到 [web/data/menu.js](C:\Users\z\Documents\微信小程序制作\web\data\menu.js)
- 分享页默认根据当前网址生成顾客端和商家端二维码
- 当前二维码使用在线接口 `api.qrserver.com` 生成，适合先快速展示；如果你要离线二维码，我可以继续替换成本地方案

## GitHub Pages 正式发布

- 你的目标仓库可直接使用：`https://github.com/z1987173748/ZRC`
- 正式发布后的默认链接会是：`https://z1987173748.github.io/ZRC/`
- 自动部署工作流在 [.github/workflows/deploy-pages.yml](C:\Users\z\Documents\微信小程序制作\.github\workflows\deploy-pages.yml)
- 发布前执行：`npm run prepare:deploy`
- 发布包输出到 [docs](C:\Users\z\Documents\微信小程序制作\docs)
- 首次在 GitHub 仓库里开启 `Settings -> Pages -> Build and deployment -> Source: GitHub Actions`

## 云开发接入

1. 在微信开发者工具里开通云开发环境
2. 把环境 ID 填到 [config/cloud.js](C:\Users\z\Documents\微信小程序制作\config\cloud.js) 的 `envId`
3. 首次进入小程序后，会自动初始化 `smart_order_meta` 集合中的 `menu` 和 `orders` 两个文档
4. 商家端上传图片时：
   会优先上传到云存储；如果未配置云环境，则退回本地持久化路径

## 导入方式

1. 打开微信开发者工具
2. 选择“导入项目”
3. 项目目录选择 `C:\Users\z\Documents\微信小程序制作`
4. `AppID` 可先使用“测试号”或保留 `touristappid`
5. 进入后先看 `pages/landing/index`，再分别切换顾客端和商家端演示

## 菜单重建

- 菜单数据和默认图片由 [scripts/build_menu_assets.py](C:\Users\z\Documents\微信小程序制作\scripts\build_menu_assets.py) 生成
- 如果你替换了桌面的 `菜单.txt`，运行 `python .\scripts\build_menu_assets.py` 即可重建 `data/menu.js` 和菜品图片

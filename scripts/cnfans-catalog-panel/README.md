# CNFans UK 本地上架面板

这是 CNFans UK 专用的本地可视化上架草稿面板。

当前版本只做框架和演示：

- 不采集真实商品
- 不写入 D1
- 不上传 R2
- 不修改前台页面
- 只保存本地 JSON 状态

## 启动方式

```bash
cd /Users/linmuse/Developer/cnfansuk/scripts/cnfans-catalog-panel
node server.mjs
```

也可以：

```bash
cd /Users/linmuse/Developer/cnfansuk/scripts/cnfans-catalog-panel
npm start
```

打开地址：

```text
http://127.0.0.1:5071
```

## 页面

1. 来源扫描
2. 候选商品池
3. 已选采集队列
4. 审核与定价
5. 发布预览
6. 面板设置

## 演示定价规则

- 从标题识别 `p数字`，例如 `p100 黑色连帽卫衣`
- 成本人民币 = p 后面的数字
- 售价人民币 = 成本人民币 × 1.8
- 英镑 = 售价人民币 ÷ 9
- 欧元 = 售价人民币 ÷ 8
- 美元 = 售价人民币 ÷ 7
- 取整规则：小数第一位 1-5 直接去掉；小数第一位 6-9 整数加一

示例：

```text
p100 → 成本人民币 100 → 售价人民币 180 → 英镑 20 / 欧元 22 / 美元 26
```

## 本地状态文件

状态保存到：

```text
scripts/cnfans-catalog-panel/data/state.json
```

## 接口检测

“面板设置”页面有只读接口检测按钮，会请求：

```text
GET https://api.cnfans.co.uk/health
```

该检测只读取接口状态，不写入任何数据。

# 网页信息爬取器与AI助手

这是一个Chrome浏览器扩展，可以帮助您爬取当前网页的各种信息，包括标题、Meta信息、链接、图片和文本内容，并且支持使用Claude 3.7 Sonnet AI模型进行问答。

## 功能特点

### 网页爬取功能
- 爬取网页标题
- 爬取Meta标签信息
- 爬取网页中的所有链接
- 爬取网页中的所有图片
- 爬取网页的主要文本内容
- 支持复制爬取结果到剪贴板
- 支持下载爬取结果为JSON文件

### AI问答功能
- 支持使用Claude 3.7 Sonnet AI模型进行问答
- 支持自由对话模式，无需爬取网页内容
- 支持基于爬取内容的问答模式，AI会根据爬取的网页内容回答问题
- 显示token使用量和费用信息
- 显示账户余额和消费进度
- 自动保存对话历史记录
- 支持查看、导出和清除历史记录

## 安装方法

1. 下载或克隆此仓库到本地
2. 打开Chrome浏览器，进入扩展管理页面（chrome://extensions/）
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"按钮
5. 选择本仓库的文件夹
6. 扩展将被安装到您的浏览器中

## 使用方法

### 网页爬取
1. 访问您想要爬取信息的网页
2. 点击Chrome工具栏中的扩展图标
3. 在弹出的窗口中，选择您想要爬取的信息类型（默认选中标题和文本内容）
4. 点击"爬取信息"按钮
5. 爬取完成后，您可以查看结果，也可以点击"复制结果"或"下载结果"按钮

### AI问答
1. 在扩展窗口中，输入您的Anthropic API密钥并保存
2. 选择对话模式：
   - 自由对话模式：取消选中"基于爬取的内容回答问题"复选框
   - 基于爬取内容的问答模式：确保选中"基于爬取的内容回答问题"复选框（需要先爬取网页内容）
3. 在问题输入框中输入您的问题
4. 点击"提问"按钮
5. 等待AI回答，同时可以查看token使用量和费用信息

### 对话历史记录
1. 每次与AI对话后，系统会自动保存对话内容到历史记录
2. 点击"查看历史"按钮可以查看所有历史对话
3. 点击"导出历史"按钮可以将所有对话历史导出为文本文件
4. 点击"清除历史"按钮可以删除所有历史记录
5. 历史记录会显示对话时间、问题、回答摘要、token使用量和费用信息
6. 历史记录最多保存50条对话，超过后会自动删除最早的记录

## API密钥获取

要使用AI问答功能，您需要一个Anthropic API密钥：
1. 访问 [Anthropic官网](https://www.anthropic.com/)
2. 注册并创建一个账户
3. 在控制台中生成API密钥
4. 将API密钥复制到扩展的API密钥输入框中并保存

## 注意事项

- 此扩展仅用于学习和研究目的
- 请尊重网站的robots.txt规则和使用条款
- 不要过度频繁地爬取同一网站，以免给服务器带来负担
- 爬取的数据仅供个人使用，请勿用于商业目的或违法活动
- 使用AI问答功能会消耗您的Anthropic API额度，请注意控制使用量

## 隐私声明

此扩展不会收集或上传您的任何个人数据。所有爬取的数据仅存储在您的浏览器中，当您关闭弹出窗口后数据将被清除。您的API密钥和对话历史记录会安全地存储在浏览器的本地存储中，仅用于与Anthropic API通信和提供历史记录功能。

## 许可证

MIT 
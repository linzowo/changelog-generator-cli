# AI changelog生成工作规则集

1. 使用`changelog-gen --version`检查当前是否安装了 `changelog-generator-cli` 工具
2. 检查项目下是否存在 `changelog-config.json` 文件
4. 如果不存在，使用`changelog-gen init`初始化配置文件，并提示用户确认配置文件内容
5. 读取配置文件

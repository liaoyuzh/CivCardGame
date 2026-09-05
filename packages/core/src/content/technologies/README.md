# 科技树配置

`ancient.json` 是远古科技树的持久内容来源，修改后由开发服务器重新加载，发布版本需重新构建。

- `id`：唯一标识。
- `name`：显示名称。
- `prerequisites`：前置科技 id 数组，空数组表示起点；多个前置表示全部满足。
- 不允许重复 id、未知前置或循环依赖。

目前仅定义名称和前置关系，不定义价格、研发收益或建筑解锁。科研卡消耗 1 锤，打开科研界面；独立科技树按钮免费浏览。改革卡目前只提供入口提示，尚无可编辑改革选项。

名称参考 Civilization VI 远古科技目录：https://www.civilopedia.net/en-US/gathering-storm/technologies/intro/ 。当前关系用于本游戏原型，不承诺与原作各版本完全一致。

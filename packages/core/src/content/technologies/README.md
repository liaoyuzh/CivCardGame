# 科技树配置

`ancient.json` 是远古科技树的持久内容来源，修改后由开发服务器重新加载，发布版本需重新构建。

- `id`：唯一标识。
- `name`：显示名称。
- `rarity`：white / blue / gold / red。
- `unlockBlueprint`：研发完成后允许进入科研商店的蓝图卡 id。
- `prerequisites`：前置科技 id 数组，空数组表示起点；多个前置表示全部满足。
- 不允许重复 id、未知前置或循环依赖。

`cost` 为正整数科研价格。以 6 人口每回合产出 6 科研为基准，入门科技价格为 6–12，后续科技为 12–18。科研卡消耗 1 锤打开随机商店，可以购买多张已展示候选，购买后不补货，关闭结束本次科研。独立科技树只免费浏览，不提供购买。科技解锁的蓝图最早在下一次商店生成时出现。

商店配置在 `../research-shop.json`，建筑供牌配置在 `../buildings/ancient.json`，蓝图的建造锤子成本、科研价格和行动效果在 `../cards.json`。

名称参考 Civilization VI 远古科技目录：https://www.civilopedia.net/en-US/gathering-storm/technologies/intro/ 。当前关系用于本游戏原型，不承诺与原作各版本完全一致。

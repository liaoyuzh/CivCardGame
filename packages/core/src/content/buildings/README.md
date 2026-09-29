> 2026-09-29 更新：自由模式每回合供养改由 `../global-config.json` 的 `FoodConsumptionPerPop` 控制，不依赖部落中心。下文 `foodPerPopulation` 的周期规则仅供旧教学脚本使用。`researchPerPopulation` 仍控制两种模式的部落中心科研产出。自由模式建筑 `availableCards` 只提供科研候选，`count` 不再发放实体牌，建筑损坏不删除已购牌。

# 部落中心人口比例

编辑 `tribal-center.json`：

```json
"foodPerPopulation": 1,
"researchPerPopulation": 1
```

- `foodPerPopulation`：周期末每人口的食物需求。
- `researchPerPopulation`：回合末每人口的科研产出。
- 默认均为 1（1:1），支持 0 和非负小数。先乘人口，再将总量向上取整。例如 5 人口、比例 0.5，结算 3。
- 食物需求在基础总量上叠加事件和卡牌调整，最终最低为 0。科研固定奖励不受比例影响。
- regular 从开局生效；tutorial 的科研仍从第三周期开启。修改比例可能改变教学脚本的供养平衡。
- 开发时修改配置自动重载；发布版本需重新构建。

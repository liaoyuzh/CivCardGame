<?xml version='1.0' encoding='utf-8'?>
<map version="1.0.1">
  <node TEXT="文明 Like 卡牌策略游戏｜核心玩法框架 v0.2">
    <node TEXT="01  开始与资源" POSITION="left" COLOR="#b04b3f">
      <node TEXT="建立当前局势">
        <node TEXT="处理回合开始效果，展示持续状态与危机" />
        <node TEXT="根据人口与适用效果确定普通劳动力" />
      </node>
      <node TEXT="人口与劳动">
        <node TEXT="劳动力最低为0，不产生欠额" />
        <node TEXT="失能与人口损失分别配置；人口减少即时影响剩余劳动力" />
      </node>
      <node TEXT="资源框架">
        <node TEXT="食物用于供养；金币为经济资源；文明值连接发展" />
        <node TEXT="【待落实】供养数值、人口增长、资源保存与恢复" />
      </node>
    </node>
    <node TEXT="02  抽牌模块" POSITION="left" COLOR="#526d9f">
      <node TEXT="已确认方向">
        <node TEXT="先取得基础手牌" />
        <node TEXT="普通行动期间，通过有限主动过牌继续获取行动" />
      </node>
      <node TEXT="具体规则">
        <node TEXT="【待落实】抽牌时点、数量、代价、手牌规模" />
        <node TEXT="【待落实】未出手牌处理、回收、洗牌与牌库耗尽" />
      </node>
      <node TEXT="改革接口">
        <node TEXT="【待落实】改革后加入抽牌体系的具体过程" />
        <node TEXT="不预设未出手牌保留，也不预设自动洗回弃牌堆" />
      </node>
    </node>
    <node TEXT="03  行动阶段" POSITION="left" COLOR="#aa6a2f">
      <node TEXT="单次行动">
        <node TEXT="选择卡牌与目标 → 检查条件 → 支付费用 → 完整结算" />
        <node TEXT="费用按卡面定义，可以为0" />
      </node>
      <node TEXT="即时产出">
        <node TEXT="直接收益在行动结算时发放" />
        <node TEXT="回合末修正记录到指定节点，不与即时产出混用" />
      </node>
      <node TEXT="执行与反馈">
        <node TEXT="资源、事件及危机进度即时更新" />
        <node TEXT="【待落实】复合效果顺序与完整行动字段" />
      </node>
    </node>
    <node TEXT="04  反馈与改革" POSITION="left" COLOR="#32785f">
      <node TEXT="行动中的循环">
        <node TEXT="出牌 → 反馈 → 调整安排 → 再出牌" />
        <node TEXT="改革通过卡牌或明确效果执行" />
      </node>
      <node TEXT="卡组与额外卡组">
        <node TEXT="卡组＝手牌＋抽牌堆＋弃牌堆" />
        <node TEXT="调出进入额外卡组；调入原则上进入卡组" />
      </node>
      <node TEXT="双线改革">
        <node TEXT="专用改革卡＝大改革；行动伴生改革＝小改革" />
        <node TEXT="小改革通过卡面价值亏模平衡" />
      </node>
      <node TEXT="改革操作">
        <node TEXT="保留三选一；【暂定规则】换牌一次一张、一换一" />
        <node TEXT="【待落实】精简方式、能力、费用、容量及亏模幅度" />
      </node>
    </node>
    <node TEXT="05  结束阶段" POSITION="left" COLOR="#377a91">
      <node TEXT="玩家主动结束">
        <node TEXT="【结束回合】可提前点击" />
        <node TEXT="无合法操作时高亮，不自动结束" />
      </node>
      <node TEXT="回合末处理">
        <node TEXT="处理供养与指定回合末效果" />
        <node TEXT="未到期危机继续保留；未出手牌处理【待落实】" />
      </node>
      <node TEXT="结算边界">
        <node TEXT="【待落实】资源、供养、人口变化和状态移除顺序" />
        <node TEXT="人口全部损失即失败；精确判定时点【待落实】" />
      </node>
    </node>
    <node TEXT="06  危机应对" POSITION="right" COLOR="#a85543">
      <node TEXT="独立运行">
        <node TEXT="自身要求、进度、期限与结算逻辑" />
        <node TEXT="完成要求不等于立即结算；普通回合结束不提前结算" />
      </node>
      <node TEXT="风险与信息">
        <node TEXT="危机指数指规模，风险度指触发可能性" />
        <node TEXT="危机可包含正向机遇；可知信息受文明水平影响" />
      </node>
      <node TEXT="奖惩与取舍">
        <node TEXT="奖励在危机实际结算时发放；未完成承担后果" />
        <node TEXT="【待落实】危机池、等级、任务、计数、主动延缓与多危机" />
      </node>
    </node>
    <node TEXT="07  紧急回合" POSITION="right" COLOR="#287f7d">
      <node TEXT="大型危机插入">
        <node TEXT="当前行动全部结算后插入；结束后返回原流程" />
        <node TEXT="使用已有手牌与卡组，其他危机计数冻结" />
      </node>
      <node TEXT="临时集中应对">
        <node TEXT="可启用独立劳动力与卡牌资源能力" />
        <node TEXT="可配置时间、出牌、资源等限制；不限定只有这些形式" />
      </node>
      <node TEXT="退出与清理">
        <node TEXT="允许提前结束，不改变危机自身结算机制" />
        <node TEXT="未用临时劳动力清零，临时卡牌清理、弃掉" />
      </node>
      <node TEXT="边界">
        <node TEXT="原则上不嵌套；无政府可以触发且已有状态保持" />
        <node TEXT="【待落实】参数、目标计数、清理去向与结束细则" />
      </node>
    </node>
    <node TEXT="08  无政府状态" POSITION="right" COLOR="#78518e">
      <node TEXT="大改革触发">
        <node TEXT="连续两个普通回合大改革，或同一普通回合连续两次" />
        <node TEXT="额外回合连续两次大改革也触发；小改革不计入" />
      </node>
      <node TEXT="初始模板">
        <node TEXT="【暂定规则】金币、文明值新增产出降低90%；持续3回合" />
        <node TEXT="已有库存不扣减；食物与劳动力不纳入直接减产" />
      </node>
      <node TEXT="提示与延续">
        <node TEXT="触发前UI告知损失，由玩家确认是否继续" />
        <node TEXT="进入额外回合后状态与减产效果继续生效" />
      </node>
      <node TEXT="计算细则">
        <node TEXT="【待落实】连续口径、跨流程计数、持续时间起算" />
        <node TEXT="【待落实】额外回合计时、小数及重复触发" />
      </node>
    </node>
    <node TEXT="09  后续设计" POSITION="right" COLOR="#876d39">
      <node TEXT="建设与发展">
        <node TEXT="建造按卡面把牌加入卡组或额外卡组，可包含一次性牌" />
        <node TEXT="【待落实】建造细则、科技、政策、文明值与时代变化" />
      </node>
      <node TEXT="体验与整理">
        <node TEXT="【待落实】大量人口损失后的低效拖延处理" />
        <node TEXT="【待落实】UI、操作节奏、时间术语与旧卡牌统一" />
      </node>
      <node TEXT="推进顺序">
        <node TEXT="T01 抽牌 → T02—T04 资源与改革 → T05—T08 危机与结算" />
        <node TEXT="T09—T12 状态与发展 → T13—T15 体验与文档" />
      </node>
    </node>
  </node>
</map>
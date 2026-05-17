# Caveman压缩规则

## 核心理念

**少说多做。75% token压缩，技术精度100%。**

> 人类说话废话多："Just simply use this really basic approach"
> 程序员说话简洁："use this approach"

---

## 7级压缩

| 级别 | 名称 | 压缩比 | 适用场景 |
|------|------|--------|----------|
| 1 | lite | 30% | Standard模式默认 |
| 2 | full | 50% | Strict模式审查 |
| 3 | ultra | 65% | 长项目Phase 4-6 |
| 4 | extreme | 75% | Emergency |
| 5 | wenyan-lite | 40% | 中文项目轻量 |
| 6 | wenyan-full | 60% | 中文项目深度 |
| 7 | wenyan-ultra | 75% | 中文极限 |

---

## 级别1: lite

**策略**: 删除废话

### 删除词
```
just, really, basically, actually, simply, very, quite, rather, pretty,
obviously, clearly, obviously, basically, generally, usually, perhaps,
maybe, probably, possibly, likely, certainly, definitely, actually
```

### 示例
```
Before: "I just basically need to basically implement this feature"
After:  "implement this feature"

Before: "This is really quite obviously the best approach"
After:  "best approach"
```

---

## 级别2: full

**策略**: 删除冠词 + 缩短短语

### 删除词
```
a, an, the, each, every, any, all, some, no
```

### 缩短短语
```
in order to         → to
due to the fact     → because
at this point       → now
for the purpose of  → for
in the event that   → if
with regard to      → about
in addition to      → also
on the other hand   → but
as well as          → and
has the ability to  → can
is able to          → can
it is necessary to  → must
take into account   → consider
make a decision     → decide
give consideration  → consider
take action         → act
```

### 示例
```
Before: "In order to complete the task, it is necessary to..."
After:  "To complete task, must..."

Before: "The user has the ability to login and also view reports"
After:  "User can login and view reports"
```

---

## 级别3: ultra

**策略**: 缩写 + 符号替换

### 技术缩写
```
database          → DB
authentication    → auth
authorization     → authz
configuration     → config
initialization    → init
implementation    → impl
application       → app
environment       → env
development       → dev
production        → prod
parameter         → param
response          → res
request           → req
function          → fn
variable          → var
object            → obj
array             → arr
string            → str
boolean           → bool
integer           → int
```

### 符号替换
```
causes / leads to / triggers    → →
results in                      → →
depends on                      → ←
requires / needs                → ←
contains / includes             → ∈
is part of                      → ∋
not equal                       → ≠
greater than or equal           → ≥
less than or equal              → ≤
approximately                   → ≈
therefore / hence               → ∴
because                         → ∵
defined as                      → ≡
equivalent                      → ≡
```

### 示例
```
Before: "Authentication causes the system to trigger the login process"
After:  "auth → system → login"

Before: "Database contains the user information"
After:  "DB ∈ user info"
```

---

## 级别4: extreme

**策略**: 极限压缩 + 代码优先

### 极限缩写
```
information    → info
generation     → gen
development    → dev
management     → mgmt
communication  → comm
international  → intl
configuration  → cfg
recommendation → rec
implementation → impl
operation      → ops
performance    → perf
experience     → exp
successful     → succ
unsuccessful   → fail
```

### 保留格式
```
✅ 保留: 代码块、反引号
✅ 保留: URL、文件路径
✅ 保留: 命令、技术术语
✅ 保留: 版本号、环境变量
✅ 保留: 行号、列号

❌ 删除: 解释性文字
❌ 删除: 废话开头
❌ 删除: 重复说明
```

### 示例
```
Before: """
The function below handles user authentication
by checking the credentials against the database
"""
After: "fn handleAuth: check creds vs DB"

Before: "So basically we need to implement this really important feature"
After: "impl important feature"
```

---

## 级别5: wenyan-lite

**策略**: 半文言

### 转换规则
```
need to            → 需
must               → 须
should             → 宜
can                → 可
cannot             → 不可
not                → 非
this                → 此
that               → 彼
these              → 此等
those              → 彼等
here               → 此处
there              → 彼处
in order to        → 以
because            → 盖因
therefore          → 故
however            → 然
but                → 然
and                → 与
or                 → 或
is                 → 乃
are                → 乃
has                → 有
have               → 有
```

### 示例
```
Before: "In order to complete this task, we need to check the database"
After:  "以成此事，需查数据库"

Before: "However, this approach cannot work because of the limitations"
After:  "然此法不可，盖因限制"
```

---

## 级别6: wenyan-full

**策略**: 全文言

### 完整转换
```
我                    → 吾
我们                  → 我等
你                    → 汝
你们                  → 汝等
他/她/它              → 其
他们/她们/它们        → 其等
这/这个               → 此
那/那个               → 彼
这里                  → 此处
那里                  → 彼处
做/做                    → 行
做完了                → 毕
开始                  → 始
结束                  → 终
完成                  → 成
失败                  → 败
成功                  → 成
问题                  → 问
答案                  → 答
原因                  → 由
结果                  → 果
现在                  → 今
以前                  → 昔
以后                  → 将来
是                    → 乃/为
否                    → 非
对                    → 然
错                    → 误
好                    → 善
坏                    → 恶
快                    → 速
慢                    → 缓
大                    → 巨
小                    → 微
多                    → 众
少                    → 寡
```

### 示例
```
Before: "We need to complete this task as soon as possible"
After:  "我等宜速成此事"

Before: "This is a very difficult problem that cannot be solved easily"
After:  "此乃巨难之问，不可轻解"
```

---

## 级别7: wenyan-ultra

**策略**: 极致文言

### 极致缩写
```
需要              → 需
需要完成          → 需成
开始工作          → 始工
工作完成          → 工毕
没有问题          → 无问
有错误            → 有误
很好              → 善
不好              → 恶
很快              → 速
很慢              → 缓
非常好            → 甚善
非常不好          → 甚恶
请确认            → 请验
请检查            → 请查
请注意            → 请注
请等待            → 请候
请稍等            → 请候
```

### 符号化
```
→    导向/导致
←    来源/依赖
∈    包含
∉    不含
∴    因此
∵    因为
≈    约等于
≠    不等于
≥    大于等于
≤    小于等于
✓    完成
✗    失败
?    疑问
!    重要/紧急
⚠    警告
```

### 示例
```
Before: "因为这个问题很复杂，所以需要更多时间来完成"
After:  "∵此问甚难 ∴需更多时成"

Before: "这个问题已经完成了，请检查确认"
After:  "此问已毕，请查✓"
```

---

## 安全降级规则

### 不压缩的情况

⚠️ **安全警告**: 安全相关内容不压缩
```
Before: "WARNING: This SQL query is vulnerable to injection"
After:  "不压缩，保持原样"
```

⚠️ **不可逆操作**: 删除、覆盖等操作说明不压缩
```
Before: "This command will DELETE all data in the database"
After:  "不压缩"
```

⚠️ **可能有歧义**: 理解不确定时不压缩
```
Before: "Seems like maybe the config might need updating"
After:  "不压缩，需确认"
```

---

## 自动触发条件

| Token使用率 | 建议压缩级别 |
|-------------|--------------|
| < 50% | 不压缩 |
| 50-70% | lite (级别1) |
| 70-85% | full (级别2) |
| 85-90% | ultra (级别3) |
| > 90% | extreme (级别4) / 强制暂停 |

---

## 实施检查清单

应用压缩前确认：
- [ ] 非安全相关内容
- [ ] 非不可逆操作
- [ ] 无歧义理解
- [ ] 技术精度100%保留

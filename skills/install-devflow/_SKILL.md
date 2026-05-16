---
name: install-devflow
description: 鑷姩瀹夎鍜屽垵濮嬪寲 DevFlow Kit 鍒板綋鍓嶉」鐩€傚綋鐢ㄦ埛鎯宠寮€濮嬩娇鐢?DevFlow Kit 鏃惰Е鍙戙€?---

# Install DevFlow Kit

鑷姩灏?DevFlow Kit 瀹夎骞堕厤缃埌褰撳墠椤圭洰涓€?
## 瑙﹀彂鍦烘櫙

- 鐢ㄦ埛璇粹€滃畨瑁?devflow-kit鈥?- 鐢ㄦ埛璇?鍒濆鍖栧伐浣滄祦绯荤粺"
- 鐢ㄦ埛璇?寮€濮嬩娇鐢?devflow"
- 鐢ㄦ埛棣栨鎻愬埌闇€瑕佷娇鐢ㄧ粨鏋勫寲寮€鍙戞祦绋?
## 鎵ц娴佺▼

### Step 1: 妫€娴嬪綋鍓嶇幆澧?
```markdown
馃攳 妫€娴嬪綋鍓嶉」鐩姸鎬?
妫€鏌ラ」:
- [ ] 鏄惁宸插瓨鍦?references/GO.md?
- [ ] 鏄惁宸插瓨鍦?.specs/ 鐩綍?
- [ ] 鏄惁宸插瓨鍦?.superpowers-memory/ 鐩綍?
- [ ] AI宸ュ叿绫诲瀷 (Cursor/Claude Code/Gemini绛?
```

**濡傛灉宸插畨瑁?*:
```
鉁?DevFlow Kit 宸插畨瑁?
褰撳墠鐘舵€?
- references/GO.md: 瀛樺湪
- .specs/: 瀛樺湪
- .superpowers-memory/: <瀛樺湪/涓嶅瓨鍦?

浣犲彲浠ョ洿鎺ヤ娇鐢?
Use devflow-kit. <浣犵殑闇€姹?

闇€瑕侀噸鏂伴厤缃悧? [Y/n]
```

**濡傛灉鏈畨瑁?*: 缁х画 Step 2

---

### Step 2: 鑷姩鍒嗘瀽椤圭洰

**AI鑷姩鎵ц**:

```markdown
馃攳 姝ｅ湪鍒嗘瀽椤圭洰缁撴瀯...

鎵弿閰嶇疆鏂囦欢:
- 鉁?package.json (Node.js椤圭洰)
- 鉁?tsconfig.json (TypeScript閰嶇疆)
- 鉁?vite.config.ts (Vite鏋勫缓閰嶇疆)

妫€娴嬫妧鏈爤:
- 鉁?React 18.2.0
- 鉁?TypeScript 5.0
- 鉁?Vite 4.3
- 鉁?React Router 6.11
- 鉁?Axios 1.4
- 鉁?Zustand 4.3

鍒嗘瀽鐩綍缁撴瀯:
- 鉁?src/components/ (15涓粍浠?
- 鉁?src/pages/ (8涓〉闈?
- 鉁?src/api/ (5涓狝PI妯″潡)
- 鉁?src/hooks/ (6涓嚜瀹氫箟Hooks)
- 鉁?src/utils/ (10涓伐鍏峰嚱鏁?

璇嗗埆鏃㈡湁鎶借薄:
- 鉁?useAuth Hook - 璁よ瘉閫昏緫
- 鉁?apiClient - HTTP瀹㈡埛绔皝瑁?- 鉁?ProtectedRoute - 璺敱瀹堝崼

鉁?椤圭洰鍒嗘瀽瀹屾垚!
```

**濡傛灉鏃犳硶鑷姩妫€娴?*:
```markdown
鈿狅笍 鏈兘鑷姩璇嗗埆椤圭洰绫诲瀷

鍙兘鍘熷洜:
- 闈炴爣鍑嗛」鐩粨鏋?- 缂哄皯閰嶇疆鏂囦欢
- 娣峰悎鎶€鏈爤

寤鸿:
1. 缁х画瀹夎锛岀◢鍚庢墜鍔ㄧ紪杈?PROJECT_CONTEXT.md
2. 鎴栨彁渚涢」鐩俊鎭府鍔〢I鏇村ソ鍦扮悊瑙?
缁х画瀹夎? [Y/n]
```

### Step 3: 璇㈤棶瀹夎閫夐」

鍦ㄨ嚜鍔ㄥ垎鏋愰」鐩悗锛屾樉绀洪€夐」锛?
璇烽€夋嫨瀹夎妯″紡:

1锔忊儯 **鍩虹妯″紡** (鎺ㄨ崘棣栨灏濊瘯)
   - 鉁?瀹夎瀹屾暣宸ヤ綔娴佺郴缁?   - 鉁?鏀寔 Fast/Standard/Strict 涓夌妯″紡
   - 鉁?鑷姩鐢熸垚鎵€鏈変骇鐗╁埌 .specs/
   - 鉂?涓嶅寘鍚法浼氳瘽璁板繂

2锔忊儯 **瀹屾暣妯″紡** (鎺ㄨ崘姝ｅ紡浣跨敤)
   - 鉁?鍖呭惈鍩虹妯″紡鍏ㄩ儴鍔熻兘
   - 鉁?鍚敤璺ㄤ細璇濊蹇嗙郴缁?(.superpowers-memory/)
   - 鉁?AI璁颁綇椤圭洰鑳屾櫙鍜屾妧鏈爤
   - 鉁?閬垮厤閲嶅娌熼€?
3锔忊儯 **棰勮妯″紡** (浠呮煡鐪?
   - 鏄剧ず灏嗗垱寤虹殑鏂囦欢鍜岀洰褰?   - 涓嶅疄闄呬慨鏀逛换浣曟枃浠?
璇烽€夋嫨 (1/2/3):
```

---

### Step 3: 鎵ц瀹夎

鏍规嵁鐢ㄦ埛閫夋嫨鎵ц瀵瑰簲鎿嶄綔:

#### 閫夐」1: 鍩虹妯″紡

**AI鑷姩鎵ц**:

```markdown
馃殌 姝ｅ湪瀹夎 DevFlow Kit (鍩虹妯″紡)...

姝ラ1: 澶嶅埗鏍稿績鏂囦欢
- 鉁?flow/ 鈫?娴佺▼缂栨帓绯荤粺
- 鉁?skills/ 鈫?Superpowers鏍稿績鎶€鑳?- 鉁?agent-skills/ 鈫?涓撲笟宸ョ▼鎶€鑳藉簱
- 鉁?adapters/ 鈫?宸ュ叿閫傞厤鍣?- 鉁?scripts/ 鈫?瀹夎鍜岀淮鎶よ剼鏈?- 鉁?docs/ 鈫?鏂囨。鍜屾暀绋?
姝ラ2: 鍒涘缓鍏ュ彛鏂囦欢
- 鉁?SKILL.md 鈫?缁熶竴鍏ュ彛
- 鉁?AGENTS.md 鈫?AI鍔╂墜鎸囦护
- 鉁?README.md 鈫?浣跨敤鏂囨。

姝ラ3: 楠岃瘉瀹夎
- 鉁?妫€鏌ュ叧閿枃浠跺畬鏁存€?- 鉁?楠岃瘉鐩綍缁撴瀯

鉁?瀹夎瀹屾垚!

浣犵幇鍦ㄥ彲浠ュ紑濮嬩娇鐢?
Use devflow-kit. <浣犵殑闇€姹?

绀轰緥:
Use devflow-kit. 鍋氫釜鐧诲綍鍔熻兘
```

**瀹為檯鎿嶄綔** (AI閫氳繃鏂囦欢绯荤粺鎿嶄綔):
```python
# AI 搴旇鎵ц鐨勬搷浣?浼唬鐮?
copy_directory("E:/LLM/skills/devflow-kit/flow", "./flow")
copy_directory("E:/LLM/skills/devflow-kit/skills", "./skills")
copy_directory("E:/LLM/skills/devflow-kit/agent-skills", "./agent-skills")
copy_directory("E:/LLM/skills/devflow-kit/adapters", "./adapters")
copy_directory("E:/LLM/skills/devflow-kit/scripts", "./scripts")
copy_directory("E:/LLM/skills/devflow-kit/docs", "./docs")
copy_file("E:/LLM/skills/devflow-kit/SKILL.md", "./SKILL.md")
copy_file("E:/LLM/skills/devflow-kit/AGENTS.md", "./AGENTS.md")
copy_file("E:/LLM/skills/devflow-kit/README.md", "./README.md")
copy_file("E:/LLM/skills/devflow-kit/LICENSE", "./LICENSE")
```

---

#### 閫夐」2: 瀹屾暣妯″紡

**AI鑷姩鎵ц**:

```markdown
馃殌 姝ｅ湪瀹夎 DevFlow Kit (瀹屾暣妯″紡)...

姝ラ1-3: 鍚屽熀纭€妯″紡

姝ラ4: 鍒濆鍖栬蹇嗙郴缁?- 鉁?鍒涘缓 .superpowers-memory/ 鐩綍
- 鉁?鐢熸垚 PROJECT_CONTEXT.md (宸茶嚜鍔ㄥ～鍏?
- 鉁?鐢熸垚 CURRENT_STATE.md 妯℃澘
- 鉁?鐢熸垚 DECISIONS.md 妯℃澘
- 鉁?鐢熸垚 KNOWN_FAILURES.md 妯℃澘
- 鉁?鍒涘缓 session-journal/ 鐩綍

姝ラ5: 灞曠ず鑷姩鎻愬彇鐨勪俊鎭?
馃搳 AI宸茶嚜鍔ㄥ垎鏋愪綘鐨勯」鐩?

PROJECT_CONTEXT.md 宸茶嚜鍔ㄥ～鍏?

# Project Context

## 椤圭洰鍩烘湰淇℃伅
- **椤圭洰鍚嶇О**: my-react-app (浠?package.json)
- **椤圭洰绫诲瀷**: 鍓嶇鍗曢〉搴旂敤
- **妫€娴嬪埌鏃堕棿**: 2026-05-16

## 鎶€鏈爤
- **鍓嶇妗嗘灦**: React 18.2.0
- **璇█**: TypeScript 5.0
- **鏋勫缓宸ュ叿**: Vite 4.3
- **鐘舵€佺鐞?*: Zustand 4.3
- **璺敱**: React Router 6.11
- **HTTP瀹㈡埛绔?*: Axios 1.4

## 椤圭洰缁撴瀯
- src/components/ - React缁勪欢 (15涓?
- src/pages/ - 椤甸潰缁勪欢 (8涓?
- src/api/ - API璋冪敤 (5涓ā鍧?
- src/hooks/ - 鑷畾涔塇ooks (6涓?
- src/utils/ - 宸ュ叿鍑芥暟 (10涓?

## 鏃㈡湁鎶借薄
- useAuth Hook - 璁よ瘉閫昏緫
- apiClient - HTTP瀹㈡埛绔皝瑁?- ProtectedRoute - 璺敱瀹堝崼缁勪欢

---

鉁?璁板繂绯荤粺鍒濆鍖栧畬鎴?

AI宸茬粡浜嗚В浣犵殑椤圭洰锛屽彲浠ョ洿鎺ュ紑濮嬪伐浣溿€?
馃挕 鎻愮ず: 
- 浣犲彲浠ラ殢鏃剁紪杈?.superpowers-memory/PROJECT_CONTEXT.md 
  琛ュ厖鏇村椤圭洰鐗瑰畾鐨勪俊鎭紙濡備笟鍔￠鍩熴€佺壒娈婄害鏉熺瓑锛?- 浣嗗ぇ澶氭暟鎯呭喌涓嬶紝AI鑷姩鎻愬彇鐨勪俊鎭凡缁忚冻澶?```

**瀹為檯鎿嶄綔**:
```python
# 鍦ㄥ熀纭€妯″紡鍩虹涓?棰濆鎵ц:
create_directory("./.superpowers-memory")
create_directory("./.superpowers-memory/session-journal")
copy_template("PROJECT_CONTEXT.md")
copy_template("CURRENT_STATE.md")
copy_template("DECISIONS.md")
copy_template("KNOWN_FAILURES.md")
```

---

#### 閫夐」3: 棰勮妯″紡

```markdown
馃憖 棰勮妯″紡 - 灏嗗垱寤轰互涓嬫枃浠?

馃搧 鏍稿績鐩綍:
  flow/                    # 娴佺▼缂栨帓绯荤粺
    鈹溾攢鈹€ GO.md              # 缁熶竴璺敱鍣?    鈹溾攢鈹€ RULES.md           # 鍏ㄥ眬绾㈢嚎
    鈹溾攢鈹€ mode-rules.md      # 妯″紡鍒ゅ畾
    鈹溾攢鈹€ stage-skills/      # 17涓猄tage Skills
    鈹溾攢鈹€ prompts/           # Prompt鍚庡
    鈹溾攢鈹€ templates/         # 浜х墿妯℃澘
    鈹斺攢鈹€ reference/         # 鍙傝€冭祫鏂?  
  skills/                  # Superpowers鏍稿績(14涓?
  agent-skills/            # 涓撲笟宸ョ▼鎶€鑳?20涓?
  adapters/                # 宸ュ叿閫傞厤鍣?  scripts/                 # 瀹夎鑴氭湰
  docs/                    # 鏂囨。

馃搫 鍏ュ彛鏂囦欢:
  SKILL.md                 # 缁熶竴鍏ュ彛
  AGENTS.md                # AI鍔╂墜鎸囦护
  README.md                # 浣跨敤鏂囨。
  LICENSE                  # MIT璁稿彲璇?
馃搧 璁板繂绯荤粺 (瀹屾暣妯″紡):
  .superpowers-memory/
    鈹溾攢鈹€ PROJECT_CONTEXT.md
    鈹溾攢鈹€ CURRENT_STATE.md
    鈹溾攢鈹€ DECISIONS.md
    鈹溾攢鈹€ KNOWN_FAILURES.md
    鈹斺攢鈹€ session-journal/

鎬昏: ~265涓枃浠? ~103涓洰褰? ~2.6MB

纭瀹夎? [Y/n]
```

---

### Step 4: 楠岃瘉瀹夎

瀹夎瀹屾垚鍚?AI鑷姩楠岃瘉:

```markdown
鉁?瀹夎楠岃瘉

妫€鏌ラ」:
- [x] references/GO.md 瀛樺湪
- [x] skills/stage-skills/ 瀛樺湪 (17涓?
- [x] skills/ 瀛樺湪 (14涓?
- [x] agent-skills/skills/ 瀛樺湪 (20涓?
- [x] SKILL.md 瀛樺湪
- [x] AGENTS.md 瀛樺湪
- [x] README.md 瀛樺湪
- [x] .specs/ 鐩綍宸插垱寤?- [x] .superpowers-memory/ 瀛樺湪 (瀹屾暣妯″紡)

鉁?鎵€鏈夋鏌ラ€氳繃!
```

濡傛湁闂:
```markdown
鉂?瀹夎楠岃瘉澶辫触

闂:
- references/GO.md 缂哄け

寤鸿:
1. 閲嶆柊杩愯瀹夎
2. 妫€鏌ユ枃浠舵潈闄?3. 鎵嬪姩澶嶅埗缂哄け鏂囦欢

闇€瑕佸府鍔╁悧? [Y/n]
```

---

### Step 5: 蹇€熶笂鎵嬪紩瀵?
```markdown
馃帀 DevFlow Kit 宸插氨缁?

蹇€熷紑濮?

1锔忊儯 **绗竴涓渶姹?*
   Use devflow-kit.
   
   鍋氫釜绠€鍗曠殑TODO鍒楄〃鍔熻兘

2锔忊儯 **鏌ョ湅鏂囨。**
   闃呰 README.md 浜嗚В瀹屾暣鍔熻兘

3锔忊儯 **閰嶇疆璁板繂** (瀹屾暣妯″紡)
   缂栬緫 .superpowers-memory/PROJECT_CONTEXT.md
   濉啓椤圭洰淇℃伅璁〢I鏇存噦浣?
馃挕 鎻愮ず: AI浼氳嚜鍔ㄨ鍙?references/GO.md 骞堕伒寰伐浣滄祦
```

---

## 鍚庣画浣跨敤

瀹夎瀹屾垚鍚?鐢ㄦ埛鍙渶:

```
Use devflow-kit. <闇€姹?
```

AI浼?
1. 鑷姩璇诲彇 `references/GO.md`
2. 鎵ц瀹屾暣宸ヤ綔娴佺▼
3. 鐢熸垚浜х墿鍒?`.specs/<req-id>/`
4. 鏇存柊璁板繂绯荤粺(濡傛灉鍚敤)

**鏃犻渶鍐嶈繍琛屼换浣曡剼鏈?**

---

## 鏁呴殰鎺掓煡

### 闂1: AI涓嶈瘑鍒?devflow-kit

**瑙ｅ喅**:
```
妫€鏌?
1. SKILL.md 鏄惁瀛樺湪浜庨」鐩牴鐩綍
2. 鏂囦欢鍚嶆槸鍚︽纭?(澶у皬鍐欐晱鎰?
3. AI宸ュ叿鏄惁宸查噸鍚?
淇:
閲嶆柊杩愯: Use install-devflow
```

### 闂2: 鎵句笉鍒?references/GO.md

**瑙ｅ喅**:
```
妫€鏌?
1. flow/ 鐩綍鏄惁瀛樺湪
2. GO.md 鏂囦欢鏄惁鍦?flow/ 涓?
淇:
鎵嬪姩澶嶅埗: E:/LLM/skills/devflow-kit/flow/ 鈫?./flow/
```

### 闂3: 璁板繂绯荤粺鏈敓鏁?
**瑙ｅ喅**:
```
妫€鏌?
1. .superpowers-memory/ 鏄惁瀛樺湪
2. PROJECT_CONTEXT.md 鏄惁鏈夊唴瀹?3. 鏄惁寮€鍚簡鏂颁細璇?
淇:
1. 缂栬緫 PROJECT_CONTEXT.md 濉啓椤圭洰淇℃伅
2. 閲嶅惎AI宸ュ叿
3. 寮€鍚柊浼氳瘽
```

---

## 楂樼骇鐢ㄦ硶

### 鍗曠嫭瀹夎鏌愪釜缁勪欢

```
鍙畨瑁呰蹇嗙郴缁?```

AI浼?
```markdown
馃摝 浠呭畨瑁呰蹇嗙郴缁?
鍒涘缓:
- .superpowers-memory/
  鈹溾攢鈹€ PROJECT_CONTEXT.md
  鈹溾攢鈹€ CURRENT_STATE.md
  鈹斺攢鈹€ ...

纭? [Y/n]
```

---

### 鏇存柊DevFlow Kit

```
鏇存柊 devflow-kit 鍒版渶鏂扮増鏈?```

AI浼?
```markdown
馃攧 鏇存柊 DevFlow Kit

澶囦唤鐜版湁鏂囦欢...
涓嬭浇鏈€鏂扮増鏈?..
鍚堝苟閰嶇疆...
楠岃瘉鏇存柊...

鉁?鏇存柊瀹屾垚!
```

---

### 鍗歌浇

```
鍗歌浇 devflow-kit
```

AI浼?
```markdown
馃棏锔?鍗歌浇 DevFlow Kit

灏嗗垹闄?
- flow/
- skills/
- agent-skills/
- adapters/
- scripts/
- docs/
- SKILL.md
- AGENTS.md
- .specs/ (鍙€?
- .superpowers-memory/ (鍙€?

鈿狅笍 姝ゆ搷浣滀笉鍙€?

纭鍗歌浇? [Y/n]
```

---

## 璁捐鍘熷垯

1. **闆舵墜鍔ㄦ搷浣?* - 鐢ㄦ埛鏃犻渶鎵ц浠讳綍鑴氭湰
2. **AI鑷姩鍖?* - 鎵€鏈夊畨瑁呮楠ょ敱AI鑷姩瀹屾垚
3. **浜や簰寮忓紩瀵?* - 娓呮櫚鐨勯€夐」鍜屾彁绀?4. **瀹夊叏楠岃瘉** - 瀹夎鍚庤嚜鍔ㄩ獙璇佸畬鏁存€?5. **鍙嬪ソ閿欒澶勭悊** - 娓呮櫚鐨勯棶棰樿瘖鏂拰淇寤鸿

---

## 瀹炵幇璇存槑

姝kill渚濊禆AI鐨勬枃浠舵搷浣滆兘鍔?
- 璇诲彇婧愭枃浠?(浠?E:/LLM/skills/devflow-kit/)
- 澶嶅埗鍒扮洰鏍囬」鐩?- 鍒涘缓鐩綍鍜屾枃浠?- 楠岃瘉鏂囦欢瀛樺湪鎬?
濡傛灉AI鏃犳硶鐩存帴鎿嶄綔鏂囦欢绯荤粺,鍙互鎻愪緵:
1. PowerShell/Bash鍛戒护璁╃敤鎴峰鍒剁矘璐?2. 鎴栬€呭垱寤轰竴涓畝鍖栫殑 `install.ps1/sh` 鑴氭湰渚涚敤鎴蜂竴閿墽琛?
浣嗕紭鍏堝皾璇旳I鑷姩瀹屾垚,淇濇寔"闆惰剼鏈?浣撻獙銆?



# 机甲旋风项目交接文档

## 项目基本信息
- **项目名称**: 机甲旋风复刻
- **技术栈**: Node.js + Phaser.js + TypeScript + Vite
- **创建日期**: 2026年4月
- **项目路径**: d:\AI_gongzuoqu\mecha-storm

## 项目结构
```
mecha-storm/
├── src/
│   ├── scenes/              # 游戏场景
│   │   ├── BootScene.ts
│   │   ├── MainMenuScene.ts
│   │   ├── CharacterSelectScene.ts
│   │   ├── HubScene.ts
│   │   ├── GameScene.ts
│   │   ├── UIScene.ts
│   │   ├── PreloadScene.ts
│   │   ├── InventoryScene.ts
│   │   └── CharacterPanelScene.ts
│   ├── entities/            # 游戏实体
│   │   ├── Player.ts
│   │   └── Enemy.ts
│   ├── utils/               # 工具类
│   │   ├── SpriteGenerator.ts
│   │   └── AssetManager.ts
│   ├── data/                # 游戏数据
│   │   ├── mechaData.ts
│   │   ├── enemyData.ts
│   │   ├── skillData.ts
│   │   ├── equipData.ts
│   │   ├── petData.ts
│   │   ├── playerData.ts
│   │   └── stageData.ts
│   └── main.ts
├── public/
│   └── assets/
│       └── sprites/
│           └── mecha/
│               ├── tianjian/
│               ├── hanxing/
│               ├── lianren/
│               ├── qiangpao/
│               ├── shanying/
│               └── shengqiang/
├── tools/                   # 工具脚本
│   ├── paper_doll.py
│   ├── generate_assets.py
│   └── convert_ref_to_sprite.py
├── scripts/
│   └── extract-assets.ts
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 开发历程

### 阶段1：项目启动
- 用户需求：复刻腾讯页游"机甲旋风"
- 技术选型：Node.js v20.11.1 + Phaser.js v3.80.1 + TypeScript v5.4.5 + Vite v5.4.21
- 目标：90%忠实复刻原版游戏

### 阶段2：美术素材探索
- **尝试1**: 寻找原版SWF文件 - 未找到
- **尝试2**: 使用ComfyUI AI生成素材
  - 问题：修改denoise值会导致角色外观变化
  - 模型兼容性问题：IPAdapter维度不匹配
- **尝试3**: Python+Pillow实现"纸娃娃"动画
  - 使用单张参考图片生成16帧动画
  - 通过缩放、旋转、位移、发光效果模拟动画
  - 成功保持角色外观一致性

### 阶段3：核心功能实现
1. **角色系统**
   - 天剑角色动画实现
   - 玩家状态管理（idle/run/attack）
   - 使用Phaser动画系统

2. **动画生成**
   - `paper_doll.py`: 从参考图片生成精灵表
   - 输出：16帧PNG精灵表 + JSON动画配置
   - 位置：`public/assets/sprites/mecha/tianjian/`

3. **资源加载**
   - `PreloadScene.ts`: 优先加载外部素材
   - 外部素材不存在时回退到程序化生成

## 关键文件说明

### 1. tools/paper_doll.py
- **功能**: 将单张参考图片转换为16帧动画
- **输入**: `D:\tianjian.png` (参考图片)
- **输出**: `public/assets/sprites/mecha/tianjian/spritesheet.png`
- **使用**: `python paper_doll.py`
- **原理**: 对参考图片应用缩放、旋转、位移等变换生成不同帧

### 2. src/entities/Player.ts
- **功能**: 玩家角色控制器
- **关键方法**:
  - `updateAnimations()`: 根据状态播放对应动画
  - 动画键格式：`mecha_{mechaKey}_{state}`
- **状态**: IDLE, RUN, ATTACK, HURT, DIE

### 3. src/scenes/PreloadScene.ts
- **功能**: 资源预加载
- **逻辑**: 检查纹理是否已存在，不存在则调用SpriteGenerator生成

### 4. src/utils/SpriteGenerator.ts
- **功能**: 程序化生成精灵（备选方案）
- **方法**: `generateSingleMecha(key)` 生成单个机甲

## 运行项目
```bash
cd d:\AI_gongzuoqu\mecha-storm
npm install
npm run dev
```
访问：http://localhost:3001/

## 已实现的机甲
- 天剑 (tianjian) - 已完成动画
- 寒星 (hanxing)
- 恋人 (lianren)
- 枪炮 (qiangpao)
- 闪影 (shanying)
- 圣枪 (shengqiang)

## 待完善功能
- 更多机甲的动画生成
- 战斗系统完善
- 装备系统
- 数值面板
- Boss战
- 掉落系统
- 连击系统

## 重要提醒
- 参考图片位置：`D:\tianjian.png`
- 生成的精灵表位置：`public/assets/sprites/mecha/tianjian/spritesheet.png`
- 使用Python 3.x + Pillow库运行paper_doll.py

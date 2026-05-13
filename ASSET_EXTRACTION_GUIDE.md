# 机甲旋风素材提取指南

## 方法一：JPEXS Free Flash Decompiler（推荐）

1. 下载 JPEXS Free Flash Decompiler
   - GitHub: https://github.com/jindrapetrik/jpexs-decompiler/releases
   - 选择最新版本的 ZIP 包下载解压

2. 获取机甲旋风 SWF 文件
   - 方式A：如果你有原版游戏缓存，搜索电脑中 `*.swf` 文件
   - 方式B：在互联网档案馆 (archive.org) 搜索 "机甲旋风" 或 "jjxf"
   - 方式C：搜索 "机甲旋风 swf 下载" 寻找资源

3. 使用 JPEXS 提取素材
   - 打开 JPEXS，File → Open → 选择 SWF 文件
   - 左侧树形结构中展开各分类：
     - **images** - 所有 PNG/JPEG 图片素材
     - **sprites** - 精灵动画（可导出为 GIF/PNG 序列帧）
     - **shapes** - 矢量图形（可导出为 SVG）
     - **sounds** - 音效和音乐（MP3/WAV）
   - 右键选择要导出的资源 → Export Selection
   - 选择导出目录，素材会自动按格式保存

4. 精灵图序列帧导出
   - 选中 sprites 中的动画精灵
   - Export → 选择 PNG 序列帧
   - 每一帧会导出为单独的 PNG 文件

## 方法二：RPGViewer30

1. 下载 RPGViewer30 游戏素材提取工具
2. 打开工具，导入 SWF 文件
3. 自动解析并列出所有可提取的资源
4. 选择需要的素材批量导出

## 素材整理规范

提取后的素材请按以下目录结构放入项目：

```
mecha-storm/
  public/
    assets/
      sprites/
        mecha/           # 机甲精灵
          tianjian/      # 天剑
            idle.png     # 待机
            run.png      # 跑步（精灵图）
            attack.png   # 攻击
            skill/       # 技能特效
          qiangpao/      # 枪炮
          shanying/      # 闪影
          lianren/       # 链刃
          shengqiang/    # 圣枪
          hanxing/       # 寒星
        enemies/         # 敌人精灵
        bosses/          # BOSS精灵
        pets/            # 宠物精灵
        npcs/            # NPC精灵
      effects/           # 特效
      ui/                # UI素材
      backgrounds/       # 背景图
      audio/             # 音频
        bgm/             # 背景音乐
        sfx/             # 音效
```

## 精灵图制作

如果导出的是序列帧，需要合并为精灵图（Spritesheet）：

1. 使用 TexturePacker 或 ShoeBox 工具
2. 将序列帧导入，设置格式为 JSON + PNG
3. 输出到 public/assets/sprites/ 对应目录
4. 在代码中使用 Phaser 的 spritesheet 加载方式

## 注意事项

- 原版游戏素材为 Flash 矢量格式，导出时建议选择 2x 缩放以获得清晰度
- 动画帧率建议保持原版 24fps 或 30fps
- 音效导出为 MP3 格式，Phaser 原生支持

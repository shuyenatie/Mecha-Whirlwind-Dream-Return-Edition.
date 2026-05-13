from PIL import Image, ImageDraw
import math
import json
import os

SRC = "D:/tianjian.png"
OUT_DIR = "D:/AI_gongzuoqu/mecha-storm/public/assets/sprites/mecha/tianjian"
FRAME_W = 80
FRAME_H = 100

img = Image.open(SRC).convert("RGBA")
iw, ih = img.size

target_h = FRAME_H - 4
scale = target_h / ih
target_w = int(iw * scale)
if target_w > FRAME_W - 4:
    scale = (FRAME_W - 4) / iw
    target_w = FRAME_W - 4
    target_h = int(ih * scale)

CHAR_W = target_w
CHAR_H = target_h
char = img.resize((CHAR_W, CHAR_H), Image.LANCZOS)
ox = (FRAME_W - CHAR_W) // 2
oy = (FRAME_H - CHAR_H) // 2

def make_frame(scale_factor=1.0, offset_y=0, offset_x=0, tint=(255, 255, 255, 255), 
               flip=False, rotation=0, glow=False, glow_color=(80, 200, 255)):
    frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
    c = char.copy()

    if flip:
        c = c.transpose(Image.FLIP_LEFT_RIGHT)

    if rotation != 0:
        c = c.rotate(rotation, Image.BICUBIC, expand=True)
        cw2, ch2 = c.size
        c = c.crop(((cw2 - CHAR_W) // 2, (ch2 - CHAR_H) // 2,
                     (cw2 + CHAR_W) // 2, (ch2 + CHAR_H) // 2))

    if scale_factor != 1.0:
        sw = int(CHAR_W * scale_factor)
        sh = int(CHAR_H * scale_factor)
        c = c.resize((sw, sh), Image.LANCZOS)
        px = (FRAME_W - sw) // 2 + offset_x
        py = oy + (CHAR_H - sh) // 2 - offset_y
        frame.paste(c, (px, py), c)
    else:
        px = ox + offset_x
        py = oy - offset_y
        frame.paste(c, (px, py), c)

    if glow:
        glow_layer = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        gd = ImageDraw.Draw(glow_layer)
        for r in range(30, 8, -6):
            alpha = max(5, 40 - r)
            gd.ellipse([FRAME_W // 2 - r, FRAME_H // 2 - r,
                        FRAME_W // 2 + r, FRAME_H // 2 + r],
                       fill=glow_color[:3] + (alpha,))
        frame = Image.alpha_composite(frame, glow_layer)

    return frame


FRAMES = {
    "idle_1": {"scale": 1.0, "y": 0},
    "idle_2": {"scale": 1.03, "y": -1},

    "run_1": {"scale": 1.0, "y": -2, "x": 3, "rot": 3},
    "run_2": {"scale": 0.98, "y": -1, "x": 0, "rot": -2},
    "run_3": {"scale": 1.01, "y": -2, "x": 4, "rot": 2},
    "run_4": {"scale": 0.99, "y": -1, "x": -1, "rot": -3},

    "attack_1": {"scale": 1.02, "y": -2, "x": 8, "rot": 5, "glow": True},
    "attack_2": {"scale": 1.04, "y": -3, "x": 10, "rot": 8, "glow": True},
    "attack_3": {"scale": 1.0, "y": 1, "x": 4, "rot": 2},

    "jump":   {"scale": 0.95, "y": -8},
    "fall":   {"scale": 1.02, "y": 3},
    "hurt":   {"scale": 0.97, "y": 2, "x": -3, "rot": -5},
    "skill_1": {"scale": 1.05, "y": -5, "glow": True, "glow_rgb": (100, 220, 255)},
    "skill_2": {"scale": 1.08, "y": -7, "rot": -3, "glow": True, "glow_rgb": (80, 240, 255)},
    "die":    {"scale": 0.90, "y": 6, "rot": 15},
    "block":  {"scale": 1.0, "y": 1, "x": -3, "rot": -8},
}

FRAME_ORDER = [
    ("idle_1", 0), ("idle_2", 1),
    ("run_1", 2), ("run_2", 3), ("run_3", 4), ("run_4", 5),
    ("attack_1", 6), ("attack_2", 7), ("attack_3", 8),
    ("jump", 9), ("fall", 10), ("hurt", 11),
    ("skill_1", 12), ("skill_2", 13),
    ("die", 14), ("block", 15),
]

sheet = Image.new("RGBA", (FRAME_W * 16, FRAME_H), (0, 0, 0, 0))

for name, idx in FRAME_ORDER:
    cfg = FRAMES[name]
    frame = make_frame(
        scale_factor=cfg.get("scale", 1.0),
        offset_y=cfg.get("y", 0),
        offset_x=cfg.get("x", 0),
        rotation=cfg.get("rot", 0),
        glow=cfg.get("glow", False),
        glow_color=cfg.get("glow_rgb", (80, 200, 255)),
    )
    sheet.paste(frame, (idx * FRAME_W, 0), frame)

os.makedirs(OUT_DIR, exist_ok=True)
sheet.save(os.path.join(OUT_DIR, "spritesheet.png"))
print(f"Spritesheet saved: {OUT_DIR}/spritesheet.png")
print(f"Char size: {CHAR_W}x{CHAR_H} in {FRAME_W}x{FRAME_H} frame")
print(f"Frames: {len(FRAME_ORDER)}")

anim_data = {
    "animations": [
        {"key": "mecha_tianjian_ext_idle", "startFrame": 0, "endFrame": 1, "frameRate": 5, "repeat": -1},
        {"key": "mecha_tianjian_ext_run", "startFrame": 2, "endFrame": 5, "frameRate": 10, "repeat": -1},
        {"key": "mecha_tianjian_ext_attack", "startFrame": 6, "endFrame": 8, "frameRate": 12, "repeat": 0},
        {"key": "mecha_tianjian_ext_jump", "startFrame": 9, "endFrame": 9, "frameRate": 6, "repeat": 0},
        {"key": "mecha_tianjian_ext_fall", "startFrame": 10, "endFrame": 10, "frameRate": 6, "repeat": 0},
        {"key": "mecha_tianjian_ext_hurt", "startFrame": 11, "endFrame": 11, "frameRate": 8, "repeat": 0},
        {"key": "mecha_tianjian_ext_skill", "startFrame": 12, "endFrame": 13, "frameRate": 8, "repeat": 0},
        {"key": "mecha_tianjian_ext_die", "startFrame": 14, "endFrame": 14, "frameRate": 4, "repeat": 0},
        {"key": "mecha_tianjian_ext_block", "startFrame": 15, "endFrame": 15, "frameRate": 4, "repeat": 0},
    ]
}
with open(os.path.join(OUT_DIR, "animations.json"), "w", encoding="utf-8") as f:
    json.dump(anim_data, f, ensure_ascii=False, indent=2)
print("Animations JSON saved.")

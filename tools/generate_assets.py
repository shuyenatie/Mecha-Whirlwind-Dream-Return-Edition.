import json
import math
import os
from dataclasses import dataclass, field
from PIL import Image, ImageDraw

FRAME_W = 80
FRAME_H = 100
TOTAL_FRAMES = 16
SPRITESHEET_W = FRAME_W * TOTAL_FRAMES
SPRITESHEET_H = FRAME_H

OUTLINE_COLOR = (18, 18, 38, 255)
OUTLINE_WIDTH = 3

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "public", "assets", "sprites", "mecha")


def brighten(c, amt):
    return tuple(min(255, int(v + amt)) for v in c[:3]) + (255,)


def darken(c, amt):
    return tuple(max(0, int(v - amt)) for v in c[:3]) + (255,)


def alpha_color(rgba, alpha):
    return rgba[:3] + (int(alpha),)


class MechaDrawer:
    def __init__(self, cfg):
        self.cfg = cfg
        self.img = None
        self.draw = None
        self.ox = 0
        self.oy = 0

    def new_frame(self, w=FRAME_W, h=FRAME_H):
        self.img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        self.draw = ImageDraw.Draw(self.img)

    def rect(self, x1, y1, x2, y2, fill, outline=OUTLINE_COLOR, ow=OUTLINE_WIDTH):
        self.draw.rectangle([x1, y1, x2, y2], fill=fill, outline=outline, width=ow)

    def ellipse(self, x1, y1, x2, y2, fill, outline=OUTLINE_COLOR, ow=OUTLINE_WIDTH):
        self.draw.ellipse([x1, y1, x2, y2], fill=fill, outline=outline, width=ow)

    def polygon(self, pts, fill, outline=OUTLINE_COLOR, ow=OUTLINE_WIDTH):
        self.draw.polygon(pts, fill=fill, outline=outline, width=ow)

    def line(self, x1, y1, x2, y2, color, w):
        self.draw.line([x1, y1, x2, y2], fill=color, width=w)

    def glow_circle(self, cx, cy, r, color):
        for i in range(3, 0, -1):
            alpha = 60 + i * 40
            cr = r + i * 2
            self.draw.ellipse(
                [cx - cr, cy - cr, cx + cr, cy + cr],
                fill=color[:3] + (alpha,),
                outline=None
            )

    def draw_head(self, cx, cy, style):
        c = self.cfg
        if style == "angular":
            self.polygon([(cx - 12, cy + 14), (cx - 14, cy - 10), (cx, cy - 16),
                          (cx + 14, cy - 10), (cx + 12, cy + 14)], c.primary)
            self.rect(cx - 9, cy - 6, cx - 3, cy - 1, c.accent)
            self.rect(cx + 3, cy - 6, cx + 9, cy - 1, c.accent)
            self.ellipse(cx - 5, cy - 4, cx - 1, cy - 1, (0, 0, 0, 200))
            self.ellipse(cx + 1, cy - 4, cx + 5, cy - 1, (0, 0, 0, 200))
            self.rect(cx - 2, cy + 3, cx + 2, cy + 7, brighten(c.accent, 40))
        elif style == "round":
            self.ellipse(cx - 12, cy - 12, cx + 12, cy + 14, c.primary)
            self.ellipse(cx - 8, cy - 8, cx + 8, cy + 10, darken(c.primary, 20))
            self.rect(cx - 8, cy - 4, cx + 8, cy + 2, c.accent, ow=1)
            self.ellipse(cx - 4, cy - 6, cx - 1, cy - 3, (255, 255, 255, 220))
            self.ellipse(cx + 1, cy - 6, cx + 4, cy - 3, (255, 255, 255, 220))
        elif style == "slim":
            self.ellipse(cx - 9, cy - 12, cx + 9, cy + 10, c.primary)
            self.ellipse(cx - 6, cy - 9, cx + 6, cy + 7, darken(c.primary, 20))
            self.ellipse(cx - 3, cy - 7, cx - 0, cy - 3, (255, 255, 255, 200))
            self.ellipse(cx + 0, cy - 7, cx + 3, cy - 3, (255, 255, 255, 200))
        elif style == "spiky":
            self.polygon([(cx - 10, cy + 12), (cx - 12, cy - 6), (cx - 3, cy - 16),
                          (cx, cy - 18), (cx + 3, cy - 16), (cx + 12, cy - 6),
                          (cx + 10, cy + 12)], c.primary)
            self.ellipse(cx - 3, cy - 8, cx + 3, cy - 2, c.accent, ow=0)

    def draw_body(self, cx, cy, style):
        c = self.cfg
        top = cy - 12
        bot = cy + 14
        if style == "armor":
            self.rect(cx - 11, top, cx + 11, bot, c.primary)
            self.rect(cx - 7, top + 4, cx + 7, bot - 4, darken(c.primary, 25))
            belt_h = bot - 3
            self.rect(cx - 11, belt_h, cx + 11, belt_h + 4, darken(c.primary, 50))
        elif style == "core":
            self.rect(cx - 10, top, cx + 10, bot, c.primary)
            self.rect(cx - 5, top + 4, cx + 5, bot - 8, darken(c.primary, 20))
            self.ellipse(cx - 3, cy - 2, cx + 3, cy + 2, c.accent, ow=0)
        elif style == "slim_body":
            self.rect(cx - 8, top + 2, cx + 8, bot - 2, c.primary)
            self.rect(cx - 5, top + 6, cx + 5, bot - 8, darken(c.primary, 20))
            self.ellipse(cx - 2, cy - 1, cx + 2, cy + 2, c.accent, ow=0)
        elif style == "tech":
            self.rect(cx - 10, top, cx + 10, bot, c.primary)
            self.line(cx - 8, top + 4, cx + 8, top + 4, brighten(c.accent, 30), 1)
            self.line(cx - 8, bot - 5, cx + 8, bot - 5, brighten(c.accent, 30), 1)
            self.ellipse(cx - 3, cy - 1, cx + 3, cy + 2, c.accent, ow=0)

    def draw_shoulder(self, cx, cy, side, stype):
        c = self.cfg
        sign = 1 if side == "left" else -1
        dx = sign * 14
        if stype == "normal":
            self.rect(cx + dx - 5, cy - 5, cx + dx + 5, cy + 5, c.primary)
            self.rect(cx + dx - 1, cy - 2, cx + dx + 2, cy + 2, brighten(c.primary, 25), ow=0)
        elif stype == "heavy":
            self.rect(cx + dx - 8, cy - 6, cx + dx + 8, cy + 6, c.primary)
            self.rect(cx + dx - 7, cy - 5, cx + dx + 7, cy + 5, brighten(c.primary, 20), ow=1)
        elif stype == "light":
            self.rect(cx + dx - 4, cy - 4, cx + dx + 3, cy + 4, c.primary)
        elif stype == "winged":
            self.polygon([(cx + dx - 6, cy - 5), (cx + dx + 6, cy - 5),
                          (cx + dx + sign * 10, cy - 14), (cx + dx + 6, cy + 2),
                          (cx + dx - 6, cy + 2)], c.primary)

    def draw_arm(self, cx, cy, side, weapon_stub=False):
        c = self.cfg
        sign = 1 if side == "left" else -1
        sx = cx + sign * 11
        sy = cy - 2
        self.rect(sx - 3, sy, sx + 3, sy + 16, c.primary)
        self.rect(sx - 3, sy + 16, sx + 2, sy + 19, darken(c.primary, 40))

    def draw_leg(self, cx, cy, side):
        c = self.cfg
        sign = 1 if side == "left" else -1
        sx = cx + sign * 4
        sy = cy + 14
        self.rect(sx - 4, sy, sx + 4, sy + 18, c.primary)
        self.rect(sx - 3, sy + 18, sx + 3, sy + 24, darken(c.primary, 40))

    def draw_weapon(self, cx, cy, wtype):
        c = self.cfg
        if wtype == "sword":
            hilt_x = cx + 14
            self.rect(hilt_x - 1, cy - 3, hilt_x + 2, cy + 8, darken(c.primary, 60))
            self.rect(hilt_x - 1, cy - 1, hilt_x + 2, cy + 3, c.accent, ow=0)
            self.polygon([(hilt_x - 2, cy - 20), (hilt_x + 2, cy - 8),
                          (hilt_x + 2, cy + 2), (hilt_x - 2, cy + 2)],
                         brighten(c.accent, 40))
            self.glow_circle(hilt_x, cy - 16, 4, c.accent)
        elif wtype == "gun":
            gun_x = cx + 13
            self.polygon([(gun_x - 2, cy - 16), (gun_x + 3, cy - 16),
                          (gun_x + 3, cy + 2), (gun_x - 2, cy + 2)],
                         darken(c.primary, 30))
            self.rect(gun_x - 1, cy - 14, gun_x + 2, cy - 8, brighten(c.accent, 40), ow=0)
            self.ellipse(gun_x - 2, cy - 18, gun_x + 3, cy - 14, brighten(c.accent, 50), ow=0)
        elif wtype == "fist":
            fx = cx + 12
            self.rect(fx - 3, cy - 5, fx + 5, cy + 2, c.primary)
            self.rect(fx - 2, cy - 3, fx + 3, cy - 0, brighten(c.accent, 60), ow=0)
        elif wtype == "chain":
            lx = cx + 13
            self.line(lx, cy - 12, lx + 4, cy + 2, brighten(c.accent, 40), 3)
            self.line(lx + 4, cy + 2, lx + 14, cy - 8, brighten(c.accent, 40), 3)
            self.ellipse(lx + 12, cy - 11, lx + 18, cy - 5, brighten(c.accent, 70), ow=0)
        elif wtype == "spear":
            spear_x = cx + 12
            self.rect(spear_x - 1, cy - 28, spear_x + 1, cy + 8, darken(c.primary, 50))
            self.polygon([(spear_x - 3, cy - 32), (spear_x + 3, cy - 32),
                          (spear_x, cy - 26)],
                         brighten(c.accent, 60))
            self.glow_circle(spear_x, cy - 30, 5, c.accent)
        elif wtype == "crystal":
            cx2 = cx + 8
            self.polygon([(cx2, cy - 22), (cx2 + 4, cy - 14), (cx2 + 3, cy - 4),
                          (cx2 - 3, cy - 4), (cx2 - 4, cy - 14)],
                         brighten(c.accent, 50))
            self.polygon([(cx2 - 1, cy - 18), (cx2 + 2, cy - 14),
                          (cx2, cy - 8)],
                         (255, 255, 255, 120), ow=0)
            self.glow_circle(cx2, cy - 14, 6, c.accent)

    def draw_mecha_base(self, pose):
        c = self.cfg
        hx = 40 + pose["hx"]
        hy = 18 + pose["hy"]
        bx = 40 + pose["bx"]
        by = 42 + pose["by"]
        self.draw_head(hx, hy, c.helmet)
        self.draw_body(bx, by, c.body_type)
        self.draw_shoulder(bx, by - 6, "left", c.shoulder)
        self.draw_shoulder(bx, by - 6, "right", c.shoulder)
        self.draw_arm(bx, by, "left")
        self.draw_arm(bx, by, "right")
        self.draw_leg(bx, by, "left")
        self.draw_leg(bx, by, "right")
        self.draw_weapon(bx, by, c.weapon)
        self.ellipse(bx - 12, by + 34, bx + 12, by + 38, darken(c.primary, 40), ow=0)
        if pose.get("glow"):
            self.glow_circle(bx, by + 2, 8, c.accent)


POSES = {
    "idle_1": {"hx": 0, "hy": 0, "bx": 0, "by": 0},
    "idle_2": {"hx": 0, "hy": -1, "bx": 0, "by": 1},
    "run_1": {"hx": 2, "hy": -2, "bx": 1, "by": -2},
    "run_2": {"hx": -1, "hy": 0, "bx": -1, "by": -1},
    "run_3": {"hx": 2, "hy": -1, "bx": 2, "by": -2},
    "run_4": {"hx": -1, "hy": -2, "bx": -1, "by": 0},
    "attack_1": {"hx": 4, "hy": -1, "bx": 6, "by": -1, "glow": True},
    "attack_2": {"hx": 6, "hy": -3, "bx": 8, "by": -2, "glow": True},
    "attack_3": {"hx": 2, "hy": 0, "bx": 3, "by": 1},
    "jump": {"hx": 0, "hy": -8, "bx": 0, "by": -8},
    "fall": {"hx": 0, "hy": 3, "bx": 0, "by": 3},
    "hurt": {"hx": -3, "hy": 2, "bx": -2, "by": 2},
    "skill_1": {"hx": 0, "hy": -4, "bx": 0, "by": -4, "glow": True},
    "skill_2": {"hx": 2, "hy": -6, "bx": 2, "by": -5, "glow": True},
    "die": {"hx": 0, "hy": 6, "bx": 0, "by": 6},
    "block": {"hx": -2, "hy": 0, "bx": -1, "by": 1},
}

FRAME_NAMES = [
    "idle_1", "idle_2",
    "run_1", "run_2", "run_3", "run_4",
    "attack_1", "attack_2", "attack_3",
    "jump", "fall", "hurt",
    "skill_1", "skill_2",
    "die", "block",
]


@dataclass
class MechaConfig:
    name_cn: str
    key: str
    primary: tuple
    secondary: tuple
    accent: tuple
    helmet: str
    shoulder: str
    body_type: str
    weapon: str


MECHA_CONFIGS = [
    MechaConfig("天剑", "tianjian",
                (60, 120, 220, 255), (140, 180, 240, 255), (80, 200, 255, 255),
                "angular", "winged", "core", "sword"),
    MechaConfig("枪炮", "qiangpao",
                (220, 60, 40, 255), (200, 100, 70, 255), (255, 160, 50, 255),
                "round", "heavy", "armor", "gun"),
    MechaConfig("闪影", "shanying",
                (90, 40, 140, 255), (150, 80, 190, 255), (60, 255, 120, 255),
                "slim", "light", "slim_body", "fist"),
    MechaConfig("链刃", "lianren",
                (200, 70, 20, 255), (240, 140, 60, 255), (255, 100, 30, 255),
                "spiky", "normal", "tech", "chain"),
    MechaConfig("圣枪", "shengqiang",
                (220, 190, 40, 255), (255, 240, 180, 255), (255, 220, 60, 255),
                "angular", "winged", "armor", "spear"),
    MechaConfig("寒星", "hanxing",
                (60, 160, 220, 255), (160, 220, 255, 255), (100, 240, 255, 255),
                "slim", "light", "core", "crystal"),
]


def generate_spritesheet(cfg: MechaConfig):
    spritesheet = Image.new("RGBA", (SPRITESHEET_W, SPRITESHEET_H), (0, 0, 0, 0))
    drawer = MechaDrawer(cfg)
    anim_data = {"animation": {}}

    for i, fname in enumerate(FRAME_NAMES):
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        drawer.draw = ImageDraw.Draw(frame)
        drawer.img = frame
        drawer.draw_mecha_base(POSES[fname])
        spritesheet.paste(frame, (i * FRAME_W, 0), frame)

    out_dir = os.path.join(OUTPUT_DIR, cfg.key)
    spritesheet_path = os.path.join(out_dir, "spritesheet.png")
    spritesheet.save(spritesheet_path, "PNG")
    print(f"  Saved: {spritesheet_path} ({SPRITESHEET_W}x{SPRITESHEET_H})")

    anim_data = {
        "animations": [
            {"key": f"mecha_{cfg.key}_ext_idle", "startFrame": 0, "endFrame": 1, "frameRate": 5, "repeat": -1},
            {"key": f"mecha_{cfg.key}_ext_run", "startFrame": 2, "endFrame": 5, "frameRate": 10, "repeat": -1},
            {"key": f"mecha_{cfg.key}_ext_attack", "startFrame": 6, "endFrame": 8, "frameRate": 12, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_jump", "startFrame": 9, "endFrame": 9, "frameRate": 6, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_fall", "startFrame": 10, "endFrame": 10, "frameRate": 6, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_hurt", "startFrame": 11, "endFrame": 11, "frameRate": 8, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_skill", "startFrame": 12, "endFrame": 13, "frameRate": 8, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_die", "startFrame": 14, "endFrame": 14, "frameRate": 4, "repeat": 0},
            {"key": f"mecha_{cfg.key}_ext_block", "startFrame": 15, "endFrame": 15, "frameRate": 4, "repeat": 0},
        ]
    }
    json_path = os.path.join(out_dir, "animations.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(anim_data, f, ensure_ascii=False, indent=2)
    print(f"  Saved: {json_path}")


def main():
    print("机甲旋风 Sprite Generator")
    print(f"Frame: {FRAME_W}x{FRAME_H}  Spritesheet: {SPRITESHEET_W}x{SPRITESHEET_H}")
    print(f"Output: {OUTPUT_DIR}")
    print()

    for cfg in MECHA_CONFIGS:
        print(f"Generating {cfg.name_cn} ({cfg.key})...")
        generate_spritesheet(cfg)

    print("\nAll done!")


if __name__ == "__main__":
    main()

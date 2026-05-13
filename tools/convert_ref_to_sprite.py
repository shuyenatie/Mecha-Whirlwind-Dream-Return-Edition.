from PIL import Image
import os

SRC = "D:/tianjian.png"
DST = "D:/AI_gongzuoqu/mecha-storm/public/assets/sprites/mecha/tianjian/spritesheet.png"

FRAME_W = 80
FRAME_H = 100
TOTAL_FRAMES = 16
SPRITESHEET_W = FRAME_W * TOTAL_FRAMES
SPRITESHEET_H = FRAME_H

ref = Image.open(SRC).convert("RGBA")
rw, rh = ref.size

target_h = FRAME_H - 4
scale = target_h / rh
target_w = int(rw * scale)

if target_w > FRAME_W - 4:
    scale = (FRAME_W - 4) / rw
    target_w = FRAME_W - 4
    target_h = int(rh * scale)

resized = ref.resize((target_w, target_h), Image.LANCZOS)

spritesheet = Image.new("RGBA", (SPRITESHEET_W, SPRITESHEET_H), (0, 0, 0, 0))
ox = (FRAME_W - target_w) // 2
oy = FRAME_H - target_h

for i in range(TOTAL_FRAMES):
    spritesheet.paste(resized, (i * FRAME_W + ox, oy), resized)

os.makedirs(os.path.dirname(DST), exist_ok=True)
spritesheet.save(DST, "PNG")
print(f"Done! Saved to {DST}")
print(f"Original: {rw}x{rh} -> Resized: {target_w}x{target_h} -> Spritesheet: {SPRITESHEET_W}x{SPRITESHEET_H}")

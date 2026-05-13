import { MechaType } from './mechaData';

export interface ImageAsset {
  key: string;
  path: string;
}

export const BACKGROUND_ASSETS: ImageAsset[] = [
  { key: 'visual_menu_bg', path: 'assets/backgrounds/menu.png' },
  { key: 'visual_character_select_bg', path: 'assets/backgrounds/character_select.png' },
  { key: 'visual_stage_earth_sky', path: 'assets/backgrounds/stage_earth_layer_sky.png' },
  { key: 'visual_stage_earth_mid', path: 'assets/backgrounds/stage_earth_layer_mid.png' },
  { key: 'visual_stage_earth_fore', path: 'assets/backgrounds/stage_earth_layer_fore.png' },
  { key: 'visual_stage_earth_ground', path: 'assets/backgrounds/stage_earth_ground.png' },
  { key: 'visual_stage_moon_battle', path: 'assets/backgrounds/stage_moon_battle.png' },
  { key: 'visual_stage_sky_artillery', path: 'assets/backgrounds/stage_sky_artillery.png' },
  { key: 'visual_stage_base_lab', path: 'assets/backgrounds/stage_base_lab.png' },
  { key: 'visual_stage_base_hangar', path: 'assets/backgrounds/stage_base_hangar.png' },
  { key: 'visual_stage_station_corridor', path: 'assets/backgrounds/stage_station_corridor.png' },
  { key: 'visual_stage_station_explore', path: 'assets/backgrounds/stage_station_explore.png' },
  { key: 'visual_stage_command_room', path: 'assets/backgrounds/stage_command_room.png' },
  { key: 'visual_stage_void_plaza', path: 'assets/backgrounds/stage_void_plaza.png' },
  { key: 'visual_stage_ground_moon', path: 'assets/backgrounds/stage_ground_moon.png' },
  { key: 'visual_stage_ground_tech', path: 'assets/backgrounds/stage_ground_tech.png' },
];

export const UI_ASSETS: ImageAsset[] = [
  { key: 'visual_ui_panel', path: 'assets/ui/panel_metal.png' },
  { key: 'visual_ui_button', path: 'assets/ui/button_blue.png' },
  { key: 'visual_ui_button_hot', path: 'assets/ui/button_gold.png' },
  { key: 'visual_ui_card', path: 'assets/ui/card_frame.png' },
];

export const EFFECT_ASSETS: ImageAsset[] = [
  { key: 'visual_fx_slash', path: 'assets/effects/slash_arc.png' },
  { key: 'visual_fx_burst', path: 'assets/effects/energy_burst.png' },
  { key: 'visual_fx_trail', path: 'assets/effects/speed_trail.png' },
];

export const MECHA_PORTRAIT_ASSETS: Record<MechaType, ImageAsset> = {
  [MechaType.TIAN_JIAN]: { key: 'portrait_tianjian', path: 'assets/portraits/mecha/tianjian.png' },
  [MechaType.QIANG_PAO]: { key: 'portrait_qiangpao', path: 'assets/portraits/mecha/qiangpao.png' },
  [MechaType.SHAN_YING]: { key: 'portrait_shanying', path: 'assets/portraits/mecha/shanying.png' },
  [MechaType.LIAN_REN]: { key: 'portrait_lianren', path: 'assets/portraits/mecha/lianren.png' },
  [MechaType.SHENG_QIANG]: { key: 'portrait_shengqiang', path: 'assets/portraits/mecha/shengqiang.png' },
  [MechaType.HAN_XING]: { key: 'portrait_hanxing', path: 'assets/portraits/mecha/hanxing.png' },
};

export const VISUAL_IMAGE_ASSETS: ImageAsset[] = [
  ...BACKGROUND_ASSETS,
  ...UI_ASSETS,
  ...EFFECT_ASSETS,
  ...Object.values(MECHA_PORTRAIT_ASSETS),
];

export interface StageVisualData {
  backgroundKey: string;
  layerKeys?: string[];
  groundKey: string;
  foregroundKey?: string;
  atmosphere: 'moon' | 'tech' | 'void';
}

const DEFAULT_STAGE_VISUAL: StageVisualData = {
  backgroundKey: 'visual_stage_moon_battle',
  groundKey: 'visual_stage_ground_moon',
  atmosphere: 'moon',
};

export const STAGE_VISUAL_DATABASE: Record<string, StageVisualData> = {
  stage_1_1: {
    backgroundKey: 'visual_stage_moon_battle',
    layerKeys: ['visual_stage_earth_sky', 'visual_stage_earth_mid', 'visual_stage_earth_fore'],
    groundKey: 'visual_stage_earth_ground',
    foregroundKey: 'visual_stage_earth_fore',
    atmosphere: 'moon',
  },
  stage_1_2: {
    backgroundKey: 'visual_stage_base_hangar',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_1_3: {
    backgroundKey: 'visual_stage_base_lab',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_2_1: {
    backgroundKey: 'visual_stage_sky_artillery',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_2_2: {
    backgroundKey: 'visual_stage_station_corridor',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_2_3: {
    backgroundKey: 'visual_stage_station_explore',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_3_1: {
    backgroundKey: 'visual_stage_station_corridor',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_3_2: {
    backgroundKey: 'visual_stage_command_room',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'tech',
  },
  stage_4_1: {
    backgroundKey: 'visual_stage_void_plaza',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'void',
  },
  stage_4_2: {
    backgroundKey: 'visual_stage_void_plaza',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'void',
  },
  stage_final: {
    backgroundKey: 'visual_stage_void_plaza',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'void',
  },
  stage_hidden_1: {
    backgroundKey: 'visual_stage_void_plaza',
    groundKey: 'visual_stage_ground_tech',
    atmosphere: 'void',
  },
};

export function getStageVisual(stageId: string): StageVisualData {
  return STAGE_VISUAL_DATABASE[stageId] || DEFAULT_STAGE_VISUAL;
}

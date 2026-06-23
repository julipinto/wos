import { describe, it, expect } from 'vitest';
import {
  buildingPowerAt,
  buildingPowerGain,
  hasBuildingPower
} from '../../src/lib/tools/upgrade/building-power';

describe('building power', () => {
  it('has tables for the buildings we model', () => {
    for (const id of ['furnace', 'embassy', 'infantryCamp', 'commandCenter', 'warAcademy'])
      expect(hasBuildingPower(id)).toBe(true);
    expect(hasBuildingPower('nope')).toBe(false);
  });

  it('reads verified Furnace anchors', () => {
    expect(buildingPowerAt('furnace', '1')).toBe(2000);
    expect(buildingPowerAt('furnace', '30')).toBe(1523500);
    expect(buildingPowerAt('furnace', 'FC10')).toBe(4754500);
  });

  it('gain is power[to] − power[from], clamped, 0 on unknown levels', () => {
    expect(buildingPowerGain('furnace', '1', '30')).toBe(1523500 - 2000);
    expect(buildingPowerGain('furnace', '30', '1')).toBe(0); // backwards
    expect(buildingPowerGain('furnace', '1', 'NOPE')).toBe(0);
    expect(buildingPowerGain('nope', '1', '30')).toBe(0);
  });
});

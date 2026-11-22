import { describe, expect, it } from 'vitest';
import { alertKindSchema } from '../schemas/alert.schema';
import { ALERT_KIND_LABEL } from './ruleKinds';
import { groupOf } from './alertGroups';

describe('alerta de sistema MODEL_CHECK (conferência semanal do rain_v1, V44)', () => {
  it('é aceito pelo schema, tem rótulo em português e cai no grupo das fontes', () => {
    expect(alertKindSchema.parse('MODEL_CHECK')).toBe('MODEL_CHECK');
    expect(ALERT_KIND_LABEL('MODEL_CHECK')).toBe('Conferência da previsão de chuva');
    expect(groupOf('MODEL_CHECK')).toBe('sensor');
  });
});

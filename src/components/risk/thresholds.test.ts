import { describe, expect, it } from 'vitest';
import { bandText, pctTxt, riskOf, sqrtScale, thresholdsOf } from './thresholds';

const TH = { medium: 0.0159, high: 0.2441 };

describe('riskOf', () => {
  it('usa >= nos dois limiares', () => {
    expect(riskOf(0.2441, TH)).toBe('HIGH');
    expect(riskOf(0.0159, TH)).toBe('MEDIUM');
    expect(riskOf(0.0158, TH)).toBe('LOW');
    expect(riskOf(0.5, TH)).toBe('HIGH');
  });
  it('sem limiares ou sem probabilidade não classifica', () => {
    expect(riskOf(0.3, null)).toBeNull();
    expect(riskOf(0.3, undefined)).toBeNull();
    expect(riskOf(null, TH)).toBeNull();
  });
});

describe('pctTxt', () => {
  it('1 casa até 10 %, inteiro depois, vírgula decimal', () => {
    expect(pctTxt(0.0159)).toBe('1,6%');
    expect(pctTxt(0.0953)).toBe('9,5%');
    expect(pctTxt(0.2441)).toBe('24%');
    expect(pctTxt(1)).toBe('100%');
  });
  it('null é traço, nunca 0 %', () => expect(pctTxt(null)).toBe('—'));
});

describe('sqrtScale', () => {
  it('abre a faixa baixa e limita em 0-1', () => {
    expect(sqrtScale(0.25)).toBe(0.5);
    expect(sqrtScale(-1)).toBe(0);
    expect(sqrtScale(2)).toBe(1);
  });
});

describe('legenda por limiares', () => {
  it('faixas em texto', () => {
    expect(bandText('LOW', TH)).toBe('abaixo de 1,6%');
    expect(bandText('MEDIUM', TH)).toBe('de 1,6% até abaixo de 24%');
    expect(bandText('HIGH', TH)).toBe('24% ou mais');
  });
  it('pega os limiares do primeiro ponto que os traz', () => {
    expect(thresholdsOf([{ floodPrediction: null }, { floodPrediction: { riskThresholds: TH } }])).toEqual(TH);
    expect(thresholdsOf([{ floodPrediction: null }])).toBeNull();
  });
});

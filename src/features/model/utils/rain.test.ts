import { describe, it, expect } from 'vitest';
import { constantRain, padRain, parseRainList, triangularRain } from './rain';

describe('parseRainList', () => {
  it('separa por espaço, ponto e vírgula e linha; aceita vírgula decimal', () => {
    expect(parseRainList('5 10;20\n2,5').values).toEqual([5, 10, 20, 2.5]);
    expect(parseRainList('1.5 3').values).toEqual([1.5, 3]);
  });
  it('lista "a, b" com espaço também separa', () => {
    expect(parseRainList('5, 10, 20').values).toEqual([5, 10, 20]);
  });
  it('erros: vazio, texto, negativo, acima de 300, mais de 72', () => {
    expect(parseRainList('  ').error).toMatch(/ao menos 1/);
    expect(parseRainList('5 abc').error).toMatch(/“abc”/);
    expect(parseRainList('-1').error).toMatch(/negativa/);
    expect(parseRainList('301').error).toMatch(/300/);
    expect(parseRainList(Array(73).fill('1').join(' ')).error).toMatch(/72/);
  });
});

describe('constantRain', () => {
  it('repete a intensidade e limita a 72 h', () => {
    expect(constantRain(5, 3)).toEqual([5, 5, 5]);
    expect(constantRain(5, 100)).toHaveLength(72);
    expect(constantRain(5, 0)).toEqual([]);
  });
});

describe('triangularRain e padRain', () => {
  it('pico no meio com máximo igual ao informado', () => {
    expect(triangularRain(75, 1)).toEqual([75]);
    expect(triangularRain(60, 3)).toEqual([20, 60, 20]);
    expect(Math.max(...triangularRain(40, 4))).toBe(40);
  });
  it('completa com zeros até o horizonte, sem cortar', () => {
    expect(padRain([5, 5], 4)).toEqual([5, 5, 0, 0]);
    expect(padRain([5, 5, 5], 2)).toEqual([5, 5, 5]);
  });
});

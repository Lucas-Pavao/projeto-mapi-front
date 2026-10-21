import { describe, it, expect } from 'vitest';
import { constantRain, parseRainList } from './rain';

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

import React from 'react';
import { InfoTip } from '@/components/InfoTip';
import { useDetailMode } from '@/lib/detailMode';

/**
 * ⓘ que só aparece no modo enxuto (5.11 item 10): o texto explicativo que, em Detalhes, aparece por extenso
 * (com OnlyInDetail) fica aqui no modo enxuto, ao lado do título.
 */
export const LeanTip: React.FC<{ text: string; className?: string; align?: 'center' | 'end' }> = ({ text, className, align }) => {
  const { detail } = useDetailMode();
  return detail ? null : <InfoTip text={text} className={className} align={align} side="bottom" />;
};

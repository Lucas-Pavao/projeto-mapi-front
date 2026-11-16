import React from 'react';
import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { syntheticWarningOf } from './provenance';
import type { FloodPrediction } from '@/features/map/schemas/floodPointResponse.schema';

/** Aviso de modelo treinado com rótulo sintético: texto visível, nunca em tooltip. Some quando o modelo não é sintético. */
export const SyntheticWarning: React.FC<{ prediction: Pick<FloodPrediction, 'trainingData' | 'syntheticWarning'> | null | undefined; className?: string }> = ({ prediction, className }) => {
  const text = syntheticWarningOf(prediction);
  if (!text) return null;
  return (
    <p role="note" data-testid="synthetic-warning"
       className={cn('m-0 flex items-start gap-1.5 rounded-md border border-warning/60 bg-warning/10 px-2 py-1 text-xs font-bold leading-4 text-warning', className)}>
      <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      {text}
    </p>
  );
};

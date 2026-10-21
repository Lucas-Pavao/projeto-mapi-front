import React, { useId } from 'react';

interface ParamSliderProps {
  label: string;
  /** Valor já formatado, ao lado do rótulo (ex.: "75,0 mm/h"). */
  valueText: string;
  hint: string;
  min: number;
  max: number;
  step: number;
  value: number;
  error?: string | null;
  onChange: (v: number) => void;
}

/** Controle deslizante do simulador: rótulo, valor em mono, trilho e dica (medidas de Simulador.dc.html). */
export const ParamSlider: React.FC<ParamSliderProps> = ({ label, valueText, hint, min, max, step, value, error, onChange }) => {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="flex justify-between text-[13px] leading-[18px] font-bold text-foreground">
        {label}
        <span className="font-mono">{valueText}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-describedby={`${id}-hint`}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
        className="m-0 w-full accent-primary"
      />
      <span id={`${id}-hint`} className="text-[11px] leading-[14px] text-muted-foreground">{hint}</span>
      {error && <span role="alert" className="text-[11px] leading-[14px] text-destructive">{error}</span>}
    </div>
  );
};

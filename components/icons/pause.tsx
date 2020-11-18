export default function Pause(): JSX.Element {
  return (
    <svg
      viewBox='0 0 24 24'
      width='14'
      height='14'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      shapeRendering='geometricPrecision'
    >
      <rect x='6' y='4' width='4' height='16' fill='var(--fill)' />
      <rect x='14' y='4' width='4' height='16' fill='var(--fill)' />
      <style jsx>{`
        svg {
          color: var(--on-background);
          --fill: currentColor;
          --stroke: var(--background);
        }
      `}</style>
    </svg>
  );
}

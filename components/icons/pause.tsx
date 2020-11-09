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
      <rect x='6' y='4' width='4' height='16' fill='var(--geist-fill)' />
      <rect x='14' y='4' width='4' height='16' fill='var(--geist-fill)' />
      <style jsx>{`
        svg {
          color: var(--geist-foreground);
          --geist-fill: currentColor;
          --geist-stroke: var(--geist-background);
        }
      `}</style>
    </svg>
  );
}

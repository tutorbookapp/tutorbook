export default function Play(): JSX.Element {
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
      <polygon points='5 3 19 12 5 21 5 3' fill='var(--geist-fill)' />
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

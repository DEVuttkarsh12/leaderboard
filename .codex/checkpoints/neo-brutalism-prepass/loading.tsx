export default function Loading() {
  return (
    <div className="boot-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="boot-loader__deck" aria-hidden="true">
        <span className="boot-loader__card boot-loader__card--one">
          <b>A</b>
          <i>SPADES</i>
        </span>
        <span className="boot-loader__card boot-loader__card--two">
          <b>7</b>
          <i>LUCK</i>
        </span>
        <span className="boot-loader__card boot-loader__card--three">
          <b>#1</b>
          <i>RANK</i>
        </span>
      </div>
      <span className="boot-loader__label">Shuffling</span>
    </div>
  );
}

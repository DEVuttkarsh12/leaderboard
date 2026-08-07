const glyphs = ["✦", "◌", "✧", "☾", "♠", "✷", "◍", "✺", "☄"];

export default function SiteBackground() {
  return (
    <div className="site-background" aria-hidden="true">
      <div className="site-background__stars" />
      <div className="site-background__veil" />
      <div className="site-background__glow site-background__glow--top" />
      <div className="site-background__glow site-background__glow--bottom" />
      <div className="site-background__glyphs">
        {glyphs.map((glyph, index) => (
          <span
            key={`${glyph}-${index}`}
            className={`site-background__glyph site-background__glyph--${index + 1}`}
          >
            {glyph}
          </span>
        ))}
      </div>
      <div className="site-background__wave site-background__wave--back" />
      <div className="site-background__wave site-background__wave--front" />
    </div>
  );
}

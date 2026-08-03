"use client";

import FaultyTerminal from "@/components/faulty-terminal";

export default function SiteBackground() {
  return (
    <div className="site-background" aria-hidden="true">
      <div className="site-background__layer">
        <FaultyTerminal
          className="site-background__terminal"
          scale={1.68}
          gridMul={[1.75, 0.92]}
          digitSize={1.18}
          timeScale={0.72}
          pause={false}
          scanlineIntensity={0.42}
          glitchAmount={0.58}
          flickerAmount={0.16}
          noiseAmp={0.54}
          chromaticAberration={0.36}
          dither={0.12}
          curvature={0.08}
          tint="#cfe8df"
          mouseReact={false}
          mouseStrength={0.18}
          pageLoadAnimation={true}
          brightness={0.52}
        />
      </div>
      <div className="site-background__veil" />
      <div className="site-background__mesh" />
      <div className="site-background__grain" />
    </div>
  );
}

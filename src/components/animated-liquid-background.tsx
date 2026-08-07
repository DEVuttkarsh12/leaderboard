"use client";

import { useEffect, useMemo, useRef } from "react";

type PresetName = "Prism" | "Lava" | "Plasma" | "Pulse" | "Vortex" | "Mist";

type AnimatedLiquidBackgroundProps = {
  preset?: PresetName;
  className?: string;
  style?: React.CSSProperties;
  radius?: number | string;
  noiseOpacity?: number;
  noiseScale?: number;
};

const PATTERN_SHAPES = {
  Checks: 0,
  Stripes: 1,
  Edge: 2,
} as const;

const WARP_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform float u_time;
uniform float u_pixelRatio;
uniform vec2 u_resolution;

uniform float u_scale;
uniform float u_rotation;
uniform vec4 u_color1;
uniform vec4 u_color2;
uniform vec4 u_color3;
uniform float u_proportion;
uniform float u_softness;
uniform float u_shape;
uniform float u_shapeScale;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;

out vec4 fragColor;

#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846

vec2 rotate(vec2 uv, float th) {
  return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv;
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  float a = random(i);
  float b = random(i + vec2(1.0, 0.0));
  float c = random(i + vec2(0.0, 1.0));
  float d = random(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  float x1 = mix(a, b, u.x);
  float x2 = mix(c, d, u.x);
  return mix(x1, x2, u.y);
}

vec4 blend_colors(vec4 c1, vec4 c2, vec4 c3, float mixer, float edgesWidth, float edge_blur) {
  vec3 color1 = c1.rgb * c1.a;
  vec3 color2 = c2.rgb * c2.a;
  vec3 color3 = c3.rgb * c3.a;

  float r1 = smoothstep(.0 + .35 * edgesWidth, .7 - .35 * edgesWidth + .5 * edge_blur, mixer);
  float r2 = smoothstep(.3 + .35 * edgesWidth, 1. - .35 * edgesWidth + edge_blur, mixer);

  vec3 blended_color_2 = mix(color1, color2, r1);
  float blended_opacity_2 = mix(c1.a, c2.a, r1);
  vec3 c = mix(blended_color_2, color3, r2);
  float o = mix(blended_opacity_2, c3.a, r2);
  return vec4(c, o);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float t = .5 * u_time;
  float noise_scale = .0005 + .006 * u_scale;

  uv -= .5;
  uv *= (noise_scale * u_resolution);
  uv = rotate(uv, u_rotation * .5 * PI);
  uv /= u_pixelRatio;
  uv += .5;

  float n1 = noise(uv * 1. + t);
  float n2 = noise(uv * 2. - t);
  float angle = n1 * TWO_PI;
  uv.x += 4. * u_distortion * n2 * cos(angle);
  uv.y += 4. * u_distortion * n2 * sin(angle);

  float iterations_number = ceil(clamp(u_swirlIterations, 1., 30.));
  for (float i = 1.; i <= iterations_number; i++) {
    uv.x += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1.5 * uv.y);
    uv.y += clamp(u_swirl, 0., 2.) / i * cos(t + i * 1. * uv.x);
  }

  float proportion = clamp(u_proportion, 0., 1.);
  float shape = 0.;
  float mixer = 0.;

  if (u_shape < .5) {
    vec2 checks_shape_uv = uv * (.5 + 3.5 * u_shapeScale);
    shape = .5 + .5 * sin(checks_shape_uv.x) * cos(checks_shape_uv.y);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else if (u_shape < 1.5) {
    vec2 stripes_shape_uv = uv * (.25 + 3. * u_shapeScale);
    float f = fract(stripes_shape_uv.y);
    shape = smoothstep(.0, .55, f) * smoothstep(1., .45, f);
    mixer = shape + .48 * sign(proportion - .5) * pow(abs(proportion - .5), .5);
  } else {
    float sh = 1. - uv.y;
    sh -= .5;
    sh /= (noise_scale * u_resolution.y);
    sh += .5;
    float shape_scaling = .2 * (1. - u_shapeScale);
    shape = smoothstep(.45 - shape_scaling, .55 + shape_scaling, sh + .3 * (proportion - .5));
    mixer = shape;
  }

  vec4 color_mix = blend_colors(
    u_color1,
    u_color2,
    u_color3,
    mixer,
    1. - clamp(u_softness, 0., 1.),
    .01 + .01 * u_scale
  );

  fragColor = vec4(color_mix.rgb, color_mix.a);
}
`;

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec4 a_position;

void main() {
  gl_Position = a_position;
}
`;

const PRESETS: Record<
  PresetName,
  {
    color1: string;
    color2: string;
    color3: string;
    rotation: number;
    proportion: number;
    scale: number;
    speed: number;
    distortion: number;
    swirl: number;
    swirlIterations: number;
    softness: number;
    offset: number;
    shape: keyof typeof PATTERN_SHAPES;
    shapeSize: number;
  }
> = {
  Prism: {
    color1: "#050505",
    color2: "#66B3FF",
    color3: "#FFFFFF",
    rotation: -50,
    proportion: 1,
    scale: 0.01,
    speed: 30,
    distortion: 0,
    swirl: 50,
    swirlIterations: 16,
    softness: 47,
    offset: -299,
    shape: "Checks",
    shapeSize: 45,
  },
  Lava: {
    color1: "#FF9F21",
    color2: "#FF0303",
    color3: "#000000",
    rotation: 114,
    proportion: 100,
    scale: 0.52,
    speed: 30,
    distortion: 7,
    swirl: 18,
    swirlIterations: 20,
    softness: 100,
    offset: 717,
    shape: "Edge",
    shapeSize: 12,
  },
  Plasma: {
    color1: "#B566FF",
    color2: "#000000",
    color3: "#000000",
    rotation: 0,
    proportion: 63,
    scale: 0.75,
    speed: 30,
    distortion: 5,
    swirl: 61,
    swirlIterations: 5,
    softness: 100,
    offset: -168,
    shape: "Checks",
    shapeSize: 28,
  },
  Pulse: {
    color1: "#66FF85",
    color2: "#000000",
    color3: "#000000",
    rotation: -167,
    proportion: 92,
    scale: 0,
    speed: 20,
    distortion: 54,
    swirl: 75,
    swirlIterations: 3,
    softness: 28,
    offset: -813,
    shape: "Checks",
    shapeSize: 79,
  },
  Vortex: {
    color1: "#000000",
    color2: "#FFFFFF",
    color3: "#000000",
    rotation: 50,
    proportion: 41,
    scale: 0.4,
    speed: 20,
    distortion: 0,
    swirl: 100,
    swirlIterations: 3,
    softness: 5,
    offset: -744,
    shape: "Stripes",
    shapeSize: 80,
  },
  Mist: {
    color1: "#050505",
    color2: "#FF66B8",
    color3: "#050505",
    rotation: 0,
    proportion: 33,
    scale: 0.48,
    speed: 39,
    distortion: 4,
    swirl: 65,
    swirlIterations: 5,
    softness: 100,
    offset: -235,
    shape: "Edge",
    shapeSize: 48,
  },
};

function getShaderColorFromString(
  colorString: string,
  fallback: [number, number, number, number] = [0, 0, 0, 1]
): [number, number, number, number] {
  if (!colorString) {
    return fallback;
  }

  if (colorString.startsWith("#")) {
    let hex = colorString.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length === 6) {
      hex += "ff";
    }

    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
      parseInt(hex.slice(6, 8), 16) / 255,
    ];
  }

  return fallback;
}

function speedEase(value: number) {
  return 0.03 + 4.97 * (1 - Math.pow(1 - value, 2.8));
}

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string
) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  return program;
}

class LocalShaderMount {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram | null = null;
  private rafId: number | null = null;
  private lastFrameTime = 0;
  private totalAnimationTime = 0;
  private speed = 1;
  private uniformLocations: Record<string, WebGLUniformLocation | null> = {};
  private resizeObserver: ResizeObserver | null = null;
  private resolutionChanged = true;

  constructor(
    private canvas: HTMLCanvasElement,
    fragmentShader: string,
    private uniforms: Record<string, number | number[]>,
    speed = 1,
    seed = 0
  ) {
    const gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) {
      throw new Error("WebGL2 not supported");
    }

    this.gl = gl;
    this.totalAnimationTime = seed;
    this.program = createProgram(gl, VERTEX_SHADER, fragmentShader);
    if (!this.program) {
      throw new Error("Failed to create shader program");
    }

    this.setupPositionAttribute();
    this.setupUniforms();
    this.setupResizeObserver();
    this.setSpeed(speed);
  }

  private setupPositionAttribute() {
    if (!this.program) return;
    const positionAttributeLocation = this.gl.getAttribLocation(
      this.program,
      "a_position"
    );
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      this.gl.STATIC_DRAW
    );
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      2,
      this.gl.FLOAT,
      false,
      0,
      0
    );
  }

  private setupUniforms() {
    if (!this.program) return;
    this.uniformLocations = {
      u_time: this.gl.getUniformLocation(this.program, "u_time"),
      u_pixelRatio: this.gl.getUniformLocation(this.program, "u_pixelRatio"),
      u_resolution: this.gl.getUniformLocation(this.program, "u_resolution"),
      ...Object.fromEntries(
        Object.keys(this.uniforms).map((key) => [
          key,
          this.gl.getUniformLocation(this.program!, key),
        ])
      ),
    };
  }

  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
    this.handleResize();
  }

  private handleResize() {
    const pixelRatio = window.devicePixelRatio || 1;
    const newWidth = this.canvas.clientWidth * pixelRatio;
    const newHeight = this.canvas.clientHeight * pixelRatio;
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
      this.canvas.width = newWidth;
      this.canvas.height = newHeight;
      this.resolutionChanged = true;
      this.gl.viewport(0, 0, newWidth, newHeight);
      this.render(performance.now());
    }
  }

  private updateProvidedUniforms() {
    if (!this.program) return;
    this.gl.useProgram(this.program);
    Object.entries(this.uniforms).forEach(([key, value]) => {
      const location = this.uniformLocations[key];
      if (!location) {
        return;
      }

      if (Array.isArray(value)) {
        if (value.length === 2) this.gl.uniform2fv(location, value);
        else if (value.length === 3) this.gl.uniform3fv(location, value);
        else if (value.length === 4) this.gl.uniform4fv(location, value);
      } else {
        this.gl.uniform1f(location, value);
      }
    });
  }

  private render = (currentTime: number) => {
    if (!this.program) return;

    const dt = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    if (this.speed !== 0) {
      this.totalAnimationTime += dt * this.speed;
    }

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform1f(this.uniformLocations.u_time, this.totalAnimationTime * 0.001);
    if (this.resolutionChanged) {
      this.gl.uniform2f(
        this.uniformLocations.u_resolution,
        this.gl.canvas.width,
        this.gl.canvas.height
      );
      this.gl.uniform1f(
        this.uniformLocations.u_pixelRatio,
        window.devicePixelRatio || 1
      );
      this.resolutionChanged = false;
    }
    this.updateProvidedUniforms();
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    if (this.speed !== 0) {
      this.requestRender();
    } else {
      this.rafId = null;
    }
  };

  private requestRender() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = requestAnimationFrame(this.render);
  }

  setSpeed(nextSpeed = 1) {
    this.speed = nextSpeed;
    if (this.rafId === null && nextSpeed !== 0) {
      this.lastFrameTime = performance.now();
      this.rafId = requestAnimationFrame(this.render);
    }
    if (this.rafId !== null && nextSpeed === 0) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  dispose() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.program) {
      this.gl.deleteProgram(this.program);
      this.program = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }
}

export default function AnimatedLiquidBackground({
  preset = "Prism",
  className,
  style,
  radius = 0,
  noiseOpacity = 0.18,
  noiseScale = 1,
}: AnimatedLiquidBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shaderRef = useRef<LocalShaderMount | null>(null);
  const inViewRef = useRef(false);
  const reducedMotionRef = useRef(false);

  const values = PRESETS[preset];

  const uniforms = useMemo(
    () => ({
      u_scale: values.scale,
      u_rotation: (values.rotation * Math.PI) / 180,
      u_color1: getShaderColorFromString(values.color1),
      u_color2: getShaderColorFromString(values.color2),
      u_color3: getShaderColorFromString(values.color3),
      u_proportion: values.proportion / 100,
      u_softness: values.softness / 100,
      u_distortion: values.distortion / 50,
      u_swirl: values.swirl / 100,
      u_swirlIterations: values.swirl === 0 ? 0 : values.swirlIterations,
      u_shapeScale: values.shapeSize / 100,
      u_shape: PATTERN_SHAPES[values.shape],
    }),
    [values]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    reducedMotionRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    try {
      shaderRef.current = new LocalShaderMount(
        canvas,
        WARP_FRAGMENT_SHADER,
        uniforms,
        0,
        values.offset * 10
      );
    } catch {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? false;
        const nextSpeed =
          inViewRef.current && !reducedMotionRef.current
            ? speedEase(values.speed / 100)
            : 0;
        shaderRef.current?.setSpeed(nextSpeed);
      },
      { threshold: 0.08 }
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
      shaderRef.current?.dispose();
      shaderRef.current = null;
    };
  }, [uniforms, values.offset, values.speed]);

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: radius,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {noiseOpacity > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: noiseOpacity,
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.14) 0.6px, transparent 0.6px)",
            backgroundSize: `${10 * noiseScale}px ${10 * noiseScale}px`,
            mixBlendMode: "soft-light",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}

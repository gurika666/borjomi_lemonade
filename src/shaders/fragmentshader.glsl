 uniform sampler2D texture1;
      uniform sampler2D texture2;
      uniform float blendValue;

      varying vec2 vUv;

      void main() {
          vec4 tex1Color = texture2D(texture1, vUv);
          vec4 tex2Color = texture2D(texture2, vUv);

          float blendFactor = smoothstep(0.0, 1.0, blendValue);

          vec4 finalColor = mix(tex1Color, tex2Color, blendFactor);

          gl_FragColor = finalColor;
      }
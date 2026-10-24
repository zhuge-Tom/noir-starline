import * as T from 'three';
/** Keep original eyes/mouth; discard baked hair instead of projecting bangs on skin. */
export function separateFaceAlbedo(material:T.MeshBasicMaterial){
 material.alphaTest=0;material.userData.separateHair=true;
 material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
 #ifdef USE_MAP
 vec2 pixel=vec2(vMapUv.x*900.0,(1.0-vMapUv.y)*1500.0);
 pixel.y+=mix(12.0,4.0,smoothstep(385.0,411.0,pixel.y));
 // A slightly narrower eye opening matches the quiet gaze in the video.
 vec2 expressionPixel=pixel;
 float leftRegion=1.0-smoothstep(1.,1.3,length((pixel-vec2(385.,379.))/vec2(25.,28.)));
 float rightRegion=1.0-smoothstep(1.,1.3,length((pixel-vec2(474.,377.))/vec2(27.,29.)));
 expressionPixel.y+=leftRegion*(pixel.y-379.)*(1.0/.89-1.0)+rightRegion*(pixel.y-377.)*(1.0/.89-1.0);
 vec4 rawFace=texture2D(map,vec2(expressionPixel.x/900.,1.0-expressionPixel.y/1500.));
 float eyeL=1.0-smoothstep(.82,1.0,length((pixel-vec2(385.,379.))/vec2(24.,26.)));
 float eyeR=1.0-smoothstep(.82,1.0,length((pixel-vec2(474.,377.))/vec2(26.,27.)));
 float mouth=1.0-smoothstep(.80,1.0,length((pixel-vec2(429.,411.))/vec2(15.,13.)));
 float feature=max(max(eyeL,eyeR),mouth);
 float skinPixel=smoothstep(.55,.76,min(rawFace.r,min(rawFace.g,rawFace.b)));
 skinPixel*=smoothstep(348.,359.,pixel.y);
 vec3 cleanSkin=vec3(.9911,.9734,.8632);
 vec3 faceColor=mix(cleanSkin,rawFace.rgb,max(feature,skinPixel));
 diffuseColor*=vec4(faceColor,1.0);
 #endif
 `)};
 material.customProgramCacheKey=()=> 'noir-original-features-without-baked-hair-raised-features-v3';
}

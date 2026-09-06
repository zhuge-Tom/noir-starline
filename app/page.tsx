'use client';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { registerSceneTools } from './webmcp';
import { SlidersHorizontal, Maximize, Minimize, RotateCcw, Orbit, Footprints, Film, Pause, Play, X, TrainFront } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { SceneAPI, SceneOptions, ViewMode } from './scene';
export default function Home(){
 const host=useRef<HTMLDivElement>(null),api=useRef<SceneAPI|null>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState(''),[panel,setPanel]=useState(false),[mode,setMode]=useState<ViewMode>('close'),[hidden,setHidden]=useState(false),[toast,setToast]=useState(''),[stats,setStats]=useState('实时 3D'),[refOpen,setRefOpen]=useState(false);
 const [opts,setOpts]=useState<SceneOptions>({wind:0.65,waves:0.55,stars:0.8,paused:false,reflections:true,quality:'high'});
 const optionRef=useRef(opts); optionRef.current=opts;
 useEffect(()=>{let cancelled=false;import('./scene').then(({createScene})=>{if(cancelled||!host.current)return;try{api.current=createScene(host.current,optionRef.current,setStats);setReady(true)}catch(e){setError(e instanceof Error?e.message:'无法初始化 3D 场景')}}).catch(()=>setError('场景载入失败，请刷新重试。'));return()=>{cancelled=true;api.current?.dispose();api.current=null}},[]);
 useEffect(()=>api.current?.setOptions(opts),[opts]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4600);return()=>clearTimeout(t)},[toast]);
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if(e.code==='Escape'){setHidden(false)}if(e.code==='KeyH'&&!(e.target instanceof HTMLInputElement))setHidden(h=>!h)};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[]);
 useEffect(()=>{api.current?.setSuspended(refOpen)},[refOpen]);
 const view=(v:ViewMode)=>{setMode(v);api.current?.setView(v);if(v==='walk')setToast('WASD 移动 · 拖动画面转向 · Q / E 升降 · Shift 加速');};
 useEffect(()=>{if(!ready)return;return registerSceneTools(v=>{flushSync(()=>setMode(v));api.current?.setView(v)})},[ready]);
 const setting=(key:'wind'|'waves'|'stars',label:string)=><div className="setting"><label id={`${key}-label`}>{label}<output>{Math.round(opts[key]*100)}%</output></label><Slider aria-labelledby={`${key}-label`} value={[opts[key]*100]} min={0} max={100} step={1} onValueChange={v=>setOpts(o=>({...o,[key]:(Array.isArray(v)?v[0]:v)/100}))}/></div>;
 return <main><div ref={host} className="world" aria-label="星海列车三维场景，可使用鼠标和键盘探索"/><div className="veil"/>{!hidden&&<>
 <header className="topbar"><div className="brand"><span className="wordmark">NOIR</span><span className="brandline"/><span className="brandtext">星海列车</span></div><div className="live"><i className="dot"/> REALTIME WORLD</div><div className="topactions"><Button className="iconbutton" aria-label={opts.paused?'继续动画':'暂停动画'} title="暂停 / 继续动画" onClick={()=>setOpts(o=>({...o,paused:!o.paused}))}>{opts.paused?<Play/>:<Pause/>}</Button><Button className="iconbutton" aria-label="场景设置" aria-expanded={panel} onClick={()=>setPanel(!panel)}><SlidersHorizontal/></Button><Button className="iconbutton" aria-label="隐藏界面" title="沉浸模式 · H" onClick={()=>setHidden(true)}><Maximize/></Button></div></header>
 <section className="scene-caption"><div className="eyebrow">NIGHT JOURNEY / 001</div><h1>驶入星光深处</h1><p>风掠过发梢，银河落在水面。</p><Dialog open={refOpen} onOpenChange={setRefOpen}><DialogTrigger render={<Button variant="link" className="ref-trigger"/>}><Film size={13}/> 查看视频参考</DialogTrigger><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>原始场景参考</DialogTitle></DialogHeader><video className="reference-video" src="/reference.mp4" poster="/reference.webp" controls muted loop playsInline preload="none"/><p className="refnote">视频仅用于对照，不作为 3D 背景。列车和角色为参照视频重建的风格化模型；不可见部分为近似补全。视频保持静音。</p></DialogContent></Dialog></section>
 <nav className="dock glass" aria-label="场景视角"><Button data-active={mode==='cinema'} onClick={()=>view('cinema')}><Film/>电影视角</Button><Button data-active={mode==='orbit'} onClick={()=>view('orbit')}><Orbit/>自由环绕</Button><Button data-active={mode==='walk'} onClick={()=>view('walk')}><Footprints/>进入场景</Button><span className="dock-sep"/><Button title="回到车尾露台" aria-label="回到车尾露台" onClick={()=>{view('close');setToast('车尾露台 · 拖动环绕角色')}} data-active={mode==='close'}><TrainFront/></Button><Button title="重置视角" aria-label="重置视角" onClick={()=>view('cinema')}><RotateCcw/></Button></nav>
 <div className="helpbar">{mode==='walk'?<><kbd>W A S D</kbd> 移动　<kbd>Q E</kbd> 升降<br/>拖动转向　<kbd>SHIFT</kbd> 加速　<kbd>H</kbd> 隐藏界面</>:<>拖动环绕　滚轮缩放<br/><kbd>W A S D</kbd> 平移　<kbd>H</kbd> 隐藏界面</>}</div><div className="coordinates">{stats}<br/>星海 · 夜行中</div>
 {panel&&<aside className="panel glass"><header>场景设置<Button variant="ghost" size="icon" aria-label="关闭设置" onClick={()=>setPanel(false)}><X/></Button></header>{setting('wind','发丝与裙摆 · 风力')}{setting('waves','水面 · 波纹')}{setting('stars','星空 · 亮度')}<div className="toggleline"><label htmlFor="reflection">实时水面倒影</label><Switch id="reflection" checked={opts.reflections} onCheckedChange={v=>setOpts(o=>({...o,reflections:v}))}/></div><div className="toggleline"><label htmlFor="quality">高清渲染</label><Switch id="quality" checked={opts.quality==='high'} onCheckedChange={v=>setOpts(o=>({...o,quality:v?'high':'low'}))}/></div><p className="note">风格化 3D 重建 · 非原始模型<br/>列车、角色与星空实时参与水面反射。性能不足时可关闭高清渲染。</p></aside>}
 </>}{hidden&&<Button className="iconbutton immersive-return" aria-label="显示界面" onClick={()=>setHidden(false)}><Minimize/></Button>}{mode==='walk'&&<><div className="crosshair"/><div className="touch-controls" aria-label="移动控制">{[['KeyW','↑'],['KeyA','←'],['KeyS','↓'],['KeyD','→'],['KeyQ','降'],['KeyE','升']].map(([code,label])=><button key={code} aria-label={`移动 ${label}`} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);api.current?.key(code,true)}} onPointerUp={()=>api.current?.key(code,false)} onPointerCancel={()=>api.current?.key(code,false)}>{label}</button>)}</div></>}{toast&&<output className="toast glass" aria-live="polite">{toast}</output>}{!ready&&<div className="loading">{error?<div className="errorbox">{error}<span>请使用支持 WebGL 2 的浏览器，并开启硬件加速。</span><Button onClick={()=>location.reload()}>重新载入</Button></div>:<div>正在驶入星海<span>构建列车、角色与水面倒影…</span></div>}</div>}</main>
}



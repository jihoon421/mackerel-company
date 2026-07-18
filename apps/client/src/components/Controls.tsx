import { useRef } from 'react';
import { inputBridge } from '../game/input';

function ActionButton({label,sub,action,onHold}:{label:string;sub:string;action:()=>void;onHold?:()=>void}){
  const timer=useRef<number|undefined>(undefined);
  return <button className="action-btn" onPointerDown={e=>{e.preventDefault();timer.current=window.setTimeout(()=>onHold?.(),520);}} onPointerUp={e=>{e.preventDefault();if(timer.current)clearTimeout(timer.current);action();}} onPointerCancel={()=>timer.current&&clearTimeout(timer.current)}><b>{label}</b><span>{sub}</span></button>;
}
export function MobileControls({solo}:{solo:boolean}){
  const stick=useRef<HTMLDivElement>(null);const active=useRef<number|null>(null);
  const update=(e:React.PointerEvent)=>{const el=stick.current;if(!el)return;const r=el.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),max=r.width*.36;inputBridge.setMove(Math.max(-1,Math.min(1,x/max)),Math.max(-1,Math.min(1,y/max)));el.style.setProperty('--knob-x',`${Math.max(-max,Math.min(max,x))}px`);el.style.setProperty('--knob-y',`${Math.max(-max,Math.min(max,y))}px`);};
  const release=(e:React.PointerEvent)=>{if(active.current!==e.pointerId)return;active.current=null;inputBridge.setMove(0,0);stick.current?.style.setProperty('--knob-x','0px');stick.current?.style.setProperty('--knob-y','0px');};
  return <div className="controls" aria-label="터치 조작">
    <div className="joystick" ref={stick} onPointerDown={e=>{active.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e);}} onPointerMove={e=>active.current===e.pointerId&&update(e)} onPointerUp={release} onPointerCancel={release}><div className="joystick-knob"/></div>
    <div className="actions-grid">
      <ActionButton label="L" sub="왼손" action={()=>inputBridge.pulse('leftUse')} onHold={()=>inputBridge.pulse('drop')}/>
      <ActionButton label="R" sub="오른손" action={()=>inputBridge.pulse('rightUse')} onHold={()=>inputBridge.pulse('drop')}/>
      <ActionButton label="↔" sub="교체" action={()=>inputBridge.pulse('swapInventory')}/>
      <ActionButton label="F" sub="상호작용" action={()=>inputBridge.pulse('interact')}/>
      <ActionButton label="↯" sub="대시" action={()=>inputBridge.pulse('dash')}/>
      <ActionButton label={solo?'▣':'!' } sub={solo?'카트 호출':'핑'} action={()=>solo?inputBridge.command('call'):inputBridge.pulse('ping')}/>
    </div>
  </div>;
}

import { Howl } from 'howler';
import * as Tone from 'tone';
import type { Settings } from '@mackerel/shared';

function wavDataUrl(frequency:number,duration=0.12,shape:'sine'|'square'='sine'):string{
  const rate=8000,samples=Math.floor(rate*duration),data=new Uint8Array(44+samples*2),view=new DataView(data.buffer);
  const write=(offset:number,text:string)=>[...text].forEach((c,i)=>view.setUint8(offset+i,c.charCodeAt(0)));
  write(0,'RIFF');view.setUint32(4,36+samples*2,true);write(8,'WAVEfmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);write(36,'data');view.setUint32(40,samples*2,true);
  for(let i=0;i<samples;i++){const t=i/rate,env=Math.max(0,1-i/samples);const raw=shape==='square'?Math.sign(Math.sin(2*Math.PI*frequency*t)):Math.sin(2*Math.PI*frequency*t);view.setInt16(44+i*2,raw*env*12000,true);}
  let binary='';for(const byte of data)binary+=String.fromCharCode(byte);return `data:audio/wav;base64,${btoa(binary)}`;
}
class AudioManager{
  private unlocked=false; private settings:Settings|null=null; private ui=new Howl({src:[wavDataUrl(620)],volume:.5}); private pickup=new Howl({src:[wavDataUrl(880,.09)],volume:.45}); private danger=new Howl({src:[wavDataUrl(180,.28,'square')],volume:.5}); private synth:Tone.Synth|null=null; private loop:Tone.Loop|null=null;
  async unlock(settings:Settings){this.settings=settings;if(this.unlocked)return;this.unlocked=true;await Tone.start();this.synth=new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.02,decay:.2,sustain:.05,release:.4}}).toDestination();this.loop=new Tone.Loop(time=>{if(!this.settings?.muted&&this.settings&&this.settings.music>0)this.synth?.triggerAttackRelease('C2','8n',time,this.settings.music*.12);},'2n').start(0);Tone.getTransport().bpm.value=54;Tone.getTransport().start();}
  update(settings:Settings){this.settings=settings;Howler.mute(settings.muted);Howler.volume(settings.sfx);}
  play(name:'ui'|'pickup'|'danger'){if(!this.settings||this.settings.muted)return;({ui:this.ui,pickup:this.pickup,danger:this.danger}[name]).play();}
  haptic(pattern:number|number[]){if(this.settings?.haptics&&'vibrate'in navigator)navigator.vibrate(pattern);}
  pause(){Tone.getTransport().pause();Howler.mute(true);} resume(){if(this.unlocked){Tone.getTransport().start();Howler.mute(this.settings?.muted??false);}}
}
export const audio=new AudioManager();

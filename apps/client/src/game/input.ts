import type { PlayerInput, Vec2 } from '@mackerel/shared';
class InputBridge{
  move:Vec2={x:0,y:0}; private seq=0; private pulses={leftUse:false,rightUse:false,interact:false,dash:false,swapInventory:false,drop:false,ping:false}; cartCommand:PlayerInput['cartCommand']='none';
  setMove(x:number,y:number){const l=Math.hypot(x,y);this.move=l>1?{x:x/l,y:y/l}:{x,y};}
  pulse(action:keyof typeof this.pulses){this.pulses[action]=true;}
  command(command:PlayerInput['cartCommand']){this.cartCommand=command;}
  consume(keyboardMove?:Vec2):PlayerInput{const move=keyboardMove&&Math.hypot(keyboardMove.x,keyboardMove.y)>.1?keyboardMove:this.move;const input:PlayerInput={seq:++this.seq,move,leftUse:this.pulses.leftUse,rightUse:this.pulses.rightUse,interact:this.pulses.interact,dash:this.pulses.dash,swapInventory:this.pulses.swapInventory,drop:this.pulses.drop,ping:this.pulses.ping,cartCommand:this.cartCommand};Object.keys(this.pulses).forEach(k=>this.pulses[k as keyof typeof this.pulses]=false);this.cartCommand='none';return input;}
}
export const inputBridge=new InputBridge();

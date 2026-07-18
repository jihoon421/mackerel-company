import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { GameMode, GameSnapshot, PlayerInput } from '@mackerel/shared';
import type { GameSimulation } from '@mackerel/simulation';
import { MackerelScene, type SceneInitData } from './MackerelScene';

export function GameHost(props:{mode:GameMode;seed:number;day:number;playerId:string;nickname:string;duration?:number|undefined;getNetworkSnapshot?:(()=>GameSnapshot|null)|undefined;sendInput?:((input:PlayerInput)=>void)|undefined;onSnapshot:(s:GameSnapshot)=>void;onFinish:(sim:GameSimulation|null,s:GameSnapshot)=>void}){
  const host=useRef<HTMLDivElement>(null);const game=useRef<Phaser.Game|null>(null);
  useEffect(()=>{if(!host.current)return;const scene=new MackerelScene();const config:Phaser.Types.Core.GameConfig={type:Phaser.AUTO,parent:host.current,width:'100%',height:'100%',backgroundColor:'#061319',scene,physics:{default:'arcade',arcade:{debug:false}},render:{antialias:true,pixelArt:false,roundPixels:false},scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH}};game.current=new Phaser.Game(config);const init:SceneInitData={...props};game.current.scene.start('MackerelScene',init);return()=>{game.current?.destroy(true);game.current=null;};},[]);
  return <div ref={host} className="game-canvas" aria-label="게임 화면"/>;
}

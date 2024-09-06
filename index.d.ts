type Game = import('./src/Game').default;
type Direction = 'up' | 'down' | 'left' | 'right';
interface Chat {
  message: string;
  tags: import('tmi.js').ChatUserstate;
  accepted: boolean;
}

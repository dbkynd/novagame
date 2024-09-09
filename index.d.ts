type Game = import('./src/Game').default;
type Direction = 'up' | 'down' | 'left' | 'right';
interface Chat {
  tags: import('tmi.js').ChatUserstate;
  message: string;
  accepted: boolean;
}

type Direction = 'up' | 'down' | 'left' | 'right';

interface Chat {
  message: string;
  tags: ChatUserstate;
  accepted: boolean;
}

interface ChatUserstate {
  color?: string;
  'display-name'?: string;
  'user-id'?: string;
  username?: string;
  [key: string]: any;
}

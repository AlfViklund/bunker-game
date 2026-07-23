export type RoomStatus = 'lobby' | 'reveal_round' | 'debate' | 'voting' | 'epilogue';

export type BotPersonality = 'panic' | 'cynic' | 'strategist' | 'unique';

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  catastrophe_title: string | null;
  catastrophe_desc: string | null;
  catastrophe_image_url: string | null;
  bunker_size: number;
  max_players: number;
  current_round: number;
  current_turn_user_id: string | null;
  turn_order: string[];
  turn_index: number;
  winner: string | null;
  epilogue_log: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  user_id: string;
  nickname: string;
  avatar_color: string;
  is_bot: boolean;
  bot_personality: BotPersonality | null;
  is_host: boolean;
  is_ready: boolean;
  is_eliminated: boolean;
  score: number;
  
  // Cards
  profession: string;
  health: string;
  hobby: string;
  phobia: string;
  luggage: string;
  extra_info: string;
  special_card: string;
  backstory?: string | null;
  temperament?: string | null;
  
  revealed_fields: string[];
  joined_at: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  is_bot: boolean;
  bot_personality: BotPersonality | null;
  message: string;
  created_at: string;
}

export interface Vote {
  id: string;
  room_id: string;
  voter_id: string;
  suspect_id: string;
  created_at: string;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_user_id: string;
  friend_nickname: string;
  friend_code: string;
  created_at: string;
}

export interface Invite {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  room_code: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

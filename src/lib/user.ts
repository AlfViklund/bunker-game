function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateGuestUser() {
  if (typeof window === 'undefined') {
    return { userId: '00000000-0000-0000-0000-000000000000', nickname: 'Выживший' };
  }

  let guestId = localStorage.getItem('bunker_guest_id');
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!guestId || !uuidRegex.test(guestId)) {
    guestId = generateUUID();
    localStorage.setItem('bunker_guest_id', guestId);
  }

  let savedNick = localStorage.getItem('bunker_guest_nick');
  if (!savedNick || !savedNick.trim()) {
    savedNick = `Выживший_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('bunker_guest_nick', savedNick);
  }

  return { userId: guestId, nickname: savedNick };
}

export function saveGuestNickname(nick: string) {
  if (typeof window !== 'undefined' && nick && nick.trim()) {
    localStorage.setItem('bunker_guest_nick', nick.trim());
  }
}

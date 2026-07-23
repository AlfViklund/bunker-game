export function getOrCreateGuestUser() {
  if (typeof window === 'undefined') {
    return { userId: 'server', nickname: 'Выживший' };
  }

  let guestId = localStorage.getItem('bunker_guest_id');
  if (!guestId) {
    guestId = `guest-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
    localStorage.setItem('bunker_guest_id', guestId);
  }

  let savedNick = localStorage.getItem('bunker_guest_nick');
  if (!savedNick) {
    savedNick = `Выживший_${Math.floor(1000 + Math.random() * 9000)}`;
    localStorage.setItem('bunker_guest_nick', savedNick);
  }

  return { userId: guestId, nickname: savedNick };
}

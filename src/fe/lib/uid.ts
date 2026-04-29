const UID_KEY = "chat_uid";
const CONVERSATION_KEY = "chat_conversation_id";

const isBrowser = typeof window !== "undefined";

export function getUid(): string {
  if (!isBrowser) return "anonymous";
  let uid = localStorage.getItem(UID_KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(UID_KEY, uid);
  }
  return uid;
}

export function createNewConversationId(): string {
  const cid = crypto.randomUUID();
  if (isBrowser) localStorage.setItem(CONVERSATION_KEY, cid);
  return cid;
}

export function setConversationId(cid: string): void {
  if (isBrowser) localStorage.setItem(CONVERSATION_KEY, cid);
}

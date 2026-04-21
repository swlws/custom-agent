"use client";

import { useState, useEffect } from "react";
import { useChat } from "./useChat";
import { MessageList } from "./MessageList";
import { InputBar } from "./InputBar";
import { PersonaPanel } from "./PersonaPanel";
import { ConversationList } from "./ConversationList";
import { SettingsPanel } from "./SettingsPanel";

export default function Chat() {
  const {
    messages,
    loading,
    sendText,
    abort,
    newChat,
    conversations,
    loadConversationList,
    switchConversation,
    conversationId,
  } = useChat();

  const [personaOpen, setPersonaOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadConversationList();
  }, [loadConversationList]);

  function handleNewChat() {
    newChat();
    loadConversationList();
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white text-gray-900 dark:bg-[#212121] dark:text-gray-100">
      {/* 左侧固定导航栏 */}
      <ConversationList
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        conversations={conversations}
        currentId={conversationId}
        onSelect={switchConversation}
        onNewChat={handleNewChat}
        onOpenPersona={() => setPersonaOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      {/* 右侧主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <MessageList
          messages={messages}
          loading={loading}
          onCardSelect={sendText}
        />
        <InputBar
          onSend={sendText}
          onAbort={abort}
          disabled={loading}
          loading={loading}
          conversationId={conversationId}
        />
      </div>

      <PersonaPanel
        isOpen={personaOpen}
        onClose={() => setPersonaOpen(false)}
      />
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={() => {}}
      />
    </div>
  );
}

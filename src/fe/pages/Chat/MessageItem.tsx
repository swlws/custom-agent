import { memo, useState, useCallback } from "react";
import MarkdownView from "@/fe/components/MarkdownView";
import { CotCard } from "@/fe/components/CotCard";
import { ErrorCard } from "@/fe/components/ErrorCard";
import { ImageCard } from "@/fe/components/ImageCard";
import { LoadingDots } from "@/fe/components/LoadingDots";
import { ChatMessage, CardType } from "@/fe/lib/chatSseClient";
import { CopySuccessIcon, CopyClipboardIcon } from "@/fe/components/icons";

interface MessageItemProps {
  message: ChatMessage;
  isLast: boolean;
  loading: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  isLast,
  loading,
}: MessageItemProps) {
  const isUser = message.role === "user";
  const cards = message.role === "assistant" ? message.cards : undefined;
  const hasContent = isUser
    ? !!message.content
    : (cards && cards.length > 0) || !!message.content;
  const showLoader = loading && isLast && !hasContent;

  // 复制内容：user 用 content，assistant 拼接所有卡片文本
  const copyText = isUser
    ? message.content
    : cards
      ? cards.map((c) => c.content).join("\n\n")
      : message.content;

  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(copyText.trim()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [copyText]);

  // 是否正在流式输出最后一张卡片
  const isStreaming = loading && isLast;

  return (
    <div
      className={`group flex w-full ${
        isUser
          ? "justify-end"
          : "justify-start rounded-2xl bg-gray-50 px-4 py-3 dark:bg-[#2f2f2f]"
      }`}
    >
      <div
        className={`relative break-words text-[15px] leading-7 ${
          isUser
            ? "max-w-[85%] rounded-3xl bg-[#303030] px-5 py-3 text-white dark:bg-[#f4f4f4] dark:text-[#202123]"
            : "w-full text-gray-900 dark:text-gray-100"
        }`}
      >
        {showLoader ? (
          <LoadingDots className="items-center gap-1 py-1" />
        ) : (
          <>
            {isUser || !cards ? (
              <MarkdownView content={message.content} />
            ) : (
              cards.map((card, idx) => {
                const isLastCard = idx === cards.length - 1;
                if (card.cardType === CardType.Cot) {
                  return (
                    <CotCard
                      key={idx}
                      content={card.content}
                      streaming={isStreaming && isLastCard}
                    />
                  );
                }
                if (card.cardType === CardType.Error) {
                  return <ErrorCard key={idx} message={card.content} />;
                }
                if (card.cardType === CardType.Image) {
                  return <ImageCard key={idx} url={card.content} />;
                }
                return <MarkdownView key={idx} content={card.content} />;
              })
            )}
            {hasContent && (
              <button
                onClick={handleCopy}
                title="复制"
                className={`mt-1 rounded-md p-1 text-gray-400 opacity-0 transition-all group-hover:opacity-100 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 ${
                  isUser ? "absolute -bottom-7 right-0" : "inline-flex"
                }`}
              >
                {copied ? <CopySuccessIcon /> : <CopyClipboardIcon />}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
});

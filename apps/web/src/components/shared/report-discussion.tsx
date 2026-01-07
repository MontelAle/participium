import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/use-profile';
import {
  usePostReportComment,
  useReportComments,
} from '@/hooks/use-report-comments';
import {
  usePostReportMessage,
  useReportMessages,
} from '@/hooks/use-report-messages';
import { cn } from '@/lib/utils';
import type { Comment, Message } from '@/types';
import { Loader2, Send } from 'lucide-react';
import React, { useState } from 'react';

interface ReportDiscussionProps {
  reportId: string;
  showComments?: boolean;
  showMessages?: boolean;
}

export function ReportDiscussion({
  reportId,
  showComments = true,
  showMessages = true,
}: ReportDiscussionProps) {
  const initialPanel: 'comments' | 'messages' = showComments
    ? 'comments'
    : 'messages';
  const [panel, setPanel] = useState<'comments' | 'messages'>(initialPanel);
  const [text, setText] = useState('');

  const { data: profile } = useProfile();
  const { data: comments, isLoading: commentsLoading } = useReportComments(
    showComments ? reportId : '',
  );
  const postComment = usePostReportComment(showComments ? reportId : '');
  const { data: messages, isLoading: messagesLoading } = useReportMessages(
    showMessages ? reportId : '',
  );
  const postMessage = usePostReportMessage(showMessages ? reportId : '');

  const isPosting =
    panel === 'comments' ? postComment.isPending : postMessage.isPending;
  const loading = panel === 'comments' ? commentsLoading : messagesLoading;

  // If neither section is enabled, render nothing
  if (!showComments && !showMessages) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      panel === 'comments'
        ? await postComment.mutateAsync(text.trim())
        : await postMessage.mutateAsync(text.trim());
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !isPosting) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  const renderItems = (items: (Comment | Message)[]) => {
    if (items.length === 0)
      return (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm italic">
          No {panel} yet.
        </div>
      );

    return (
      <div className="flex flex-col gap-2 p-1">
        {items.map((item, index) => {
          const isSameUser =
            index > 0 && items[index - 1]?.user?.id === item.user?.id;
          const isCurrentUser = profile?.userId === item.user?.id;

          return (
            <div
              key={item.id}
              className={cn(
                'flex gap-3',
                !isSameUser ? 'mt-5' : 'mt-1',
                isCurrentUser ? 'justify-end' : 'justify-start',
              )}
            >
              {/* Avatar a sinistra per messaggi ricevuti */}
              {!isCurrentUser && (
                <div className="w-10 shrink-0">
                  {!isSameUser && (
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="text-xs bg-slate-100 uppercase">
                        {item.user?.firstName?.[0]}
                        {item.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}

              <div
                className={cn(
                  'flex flex-col w-3/4',
                  isCurrentUser ? 'items-end' : 'items-start',
                )}
              >
                {!isSameUser && (
                  <span
                    className={cn(
                      'text-xs font-bold mb-1',
                      isCurrentUser
                        ? 'text-emerald-700 mr-1'
                        : 'text-slate-900 ml-1',
                    )}
                  >
                    {item.user?.firstName} {item.user?.lastName}
                  </span>
                )}

                <div
                  className={cn(
                    'relative group px-3 py-2 text-base transition-all w-full',
                    isCurrentUser
                      ? 'bg-emerald-50 ring-1 ring-emerald-200 text-emerald-900'
                      : 'bg-white ring-1 ring-slate-200 text-slate-700',
                    isCurrentUser &&
                      !isSameUser &&
                      'rounded-2xl rounded-tr-none',
                    isCurrentUser && isSameUser && 'rounded-2xl',
                    !isCurrentUser &&
                      !isSameUser &&
                      'rounded-2xl rounded-tl-none',
                    !isCurrentUser && isSameUser && 'rounded-2xl',
                  )}
                >
                  <div className="whitespace-pre-wrap wrap-break-word leading-relaxed pr-14">
                    {item.content}
                  </div>

                  <span
                    className={cn(
                      'absolute bottom-1.5 right-2 text-[10px] font-medium',
                      isCurrentUser ? 'text-emerald-600' : 'text-slate-400',
                    )}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {isCurrentUser && (
                <div className="w-10 shrink-0">
                  {!isSameUser && (
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback className="text-xs bg-slate-100 uppercase">
                        {item.user?.firstName?.[0]}
                        {item.user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-[700px] border-none shadow-lg overflow-hidden ring-1 ring-black/5 py-0">
      <Tabs
        value={panel}
        onValueChange={(v) => setPanel(v as 'comments' | 'messages')}
        className="flex flex-col h-full"
      >
        <div className="px-4 pt-4 pb-2 bg-white border-b">
          {showComments && showMessages ? (
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="comments" className="text-sm">
                Comments
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-sm">
                Messages
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="p-1">
              <span className="text-base font-medium">
                {showComments ? 'Internal Comments' : 'Citizen Messages'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-4">
            {loading ? (
              <div className="flex items-center justify-center h-full pt-10">
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              </div>
            ) : (
              <div className="py-4">
                {panel === 'comments'
                  ? renderItems(comments || [])
                  : renderItems(messages || [])}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="p-4 bg-white border-t">
          <form
            onSubmit={handleSubmit}
            className="relative flex flex-col gap-2"
          >
            <div className="relative">
              <Textarea
                placeholder={
                  panel === 'comments'
                    ? 'Add internal note...'
                    : 'Add message...'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isPosting}
                className="min-h-20 pr-12 resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 transition-all rounded-xl"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isPosting || !text.trim()}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-lg transition-all shadow-md"
              >
                {isPosting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </Tabs>
    </Card>
  );
}

export default ReportDiscussion;

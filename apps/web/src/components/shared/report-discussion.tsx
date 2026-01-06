import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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

  const { data: comments, isLoading: commentsLoading } =
    useReportComments(reportId);
  const postComment = usePostReportComment(reportId);
  const { data: messages, isLoading: messagesLoading } =
    useReportMessages(reportId);
  const postMessage = usePostReportMessage(reportId);

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

  const renderItems = (items: (Comment | Message)[]) => {
    if (items.length === 0)
      return (
        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-xs italic">
          No {panel} yet.
        </div>
      );

    return (
      <div className="flex flex-col gap-1 p-1">
        {items.map((item, index) => {
          const isSameUser =
            index > 0 && items[index - 1]?.user?.id === item.user?.id;

          return (
            <div
              key={item.id}
              className={cn('flex gap-3', !isSameUser ? 'mt-4' : 'mt-0')}
            >
              <div className="w-8 flex-shrink-0">
                {!isSameUser && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback className="text-[10px] bg-slate-100 uppercase">
                      {item.user?.firstName?.[0]}
                      {item.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>

              {/* FIX: Use max-w-[calc(100%-44px)] to account for avatar + gap width precisely */}
              <div className="flex flex-col flex-1 min-w-0 max-w-[85%]">
                {!isSameUser && (
                  <span className="text-[11px] font-bold text-slate-900 mb-1 ml-1">
                    {item.user?.firstName} {item.user?.lastName}
                  </span>
                )}

                <div
                  className={cn(
                    'relative group px-3 py-2 text-sm ring-1 ring-inset transition-all w-full overflow-hidden',
                    'bg-white ring-slate-200 text-slate-700',
                    !isSameUser ? 'rounded-2xl rounded-tl-none' : 'rounded-2xl',
                  )}
                >
                  {/* FIX: changed break-words to break-all for total control */}
                  <div className="whitespace-pre-wrap break-all leading-relaxed pb-4">
                    {item.content}
                  </div>

                  <span className="absolute bottom-1.5 right-2 text-[9px] font-medium text-slate-400">
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="flex flex-col h-[550px] border-none shadow-lg overflow-hidden ring-1 ring-black/5 py-0">
      <Tabs
        value={panel}
        onValueChange={(v) => setPanel(v as 'comments' | 'messages')}
        className="flex flex-col h-full"
      >
        <div className="px-4 pt-4 pb-2 bg-white border-b">
          {showComments && showMessages ? (
            <TabsList className="grid w-full grid-cols-2 p-1">
              <TabsTrigger value="comments" className="text-xs">
                Internal Comments
              </TabsTrigger>
              <TabsTrigger value="messages" className="text-xs">
                Citizen Messages
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="p-1">
              <span className="text-sm font-medium">
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
                    : 'Message the reporter...'
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isPosting}
                className="min-h-[80px] pr-12 resize-none bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 transition-all rounded-xl"
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

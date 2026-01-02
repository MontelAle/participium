import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  usePostReportMessage,
  useReportMessages,
} from '@/hooks/use-report-messages';
import { useState } from 'react';
import { Separator } from '../ui/separator';

interface ReportMessagesProps {
  reportId: string;
}

export function ReportMessages({ reportId }: ReportMessagesProps) {
  const { data: messages, isLoading: messagesLoading } =
    useReportMessages(reportId);
  const [messageText, setMessageText] = useState('');
  const [messageError, setMessageError] = useState('');
  const postMessage = usePostReportMessage(reportId);

  const handleAddMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessageError('');
    if (!messageText.trim()) {
      setMessageError('Message cannot be empty.');
      return;
    }
    try {
      await postMessage.mutateAsync(messageText.trim());
      setMessageText('');
    } catch (err) {
      setMessageError('Failed to send message.');
    }
  };

  return (
    <Card className="p-6 flex flex-col border-none bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <div className="space-y-4 flex-1 flex flex-col min-w-0">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Send Message
          </h4>
          <form onSubmit={handleAddMessage} className="flex flex-col gap-2">
            <textarea
              className="border rounded-lg p-3 min-h-[60px] resize-y bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 transition text-sm"
              placeholder="Write a message to the reporter..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={postMessage.isPending}
              maxLength={2000}
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={postMessage.isPending || !messageText.trim()}
                size="sm"
                className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
              >
                {postMessage.isPending ? 'Sending...' : 'Send Message'}
              </Button>
              {messageError && (
                <span className="text-red-500 text-xs font-medium">
                  {messageError}
                </span>
              )}
            </div>
          </form>
        </div>

        <Separator className="bg-gray-100" />
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Messages
          </h4>

          {messagesLoading ? (
            <div className="text-muted-foreground text-sm">
              Loading messages...
            </div>
          ) : messages && messages.length > 0 ? (
            <ul className="space-y-3">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-primary text-xs">
                      {message.user?.firstName} {message.user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-line">
                    {message.content}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm">
              No messages yet.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

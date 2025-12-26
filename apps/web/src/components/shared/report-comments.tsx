import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  usePostReportComment,
  useReportComments,
} from '@/hooks/use-report-comments';
import { useState } from 'react';
import { Separator } from '../ui/separator';

interface ReportCommentsProps {
  reportId: string;
}

export function ReportComments({ reportId }: ReportCommentsProps) {
  const { data: comments, isLoading: commentsLoading } =
    useReportComments(reportId);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const postComment = usePostReportComment(reportId);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError('');
    if (!commentText.trim()) {
      setCommentError('Comment cannot be empty.');
      return;
    }
    try {
      await postComment.mutateAsync(commentText.trim());
      setCommentText('');
    } catch (err) {
      setCommentError('Failed to post comment.');
    }
  };

  return (
    <Card className="p-6 flex flex-col border-none bg-white/90 backdrop-blur-sm ring-1 ring-gray-200">
      <div className="space-y-4 flex-1 flex flex-col min-w-0">
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Add Comment
          </h4>
          <form onSubmit={handleAddComment} className="flex flex-col gap-2">
            <textarea
              className="border rounded-lg p-3 min-h-[60px] resize-y bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/30 transition text-sm"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={postComment.isPending}
              maxLength={1000}
            />
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={postComment.isPending || !commentText.trim()}
                size="sm"
                className="h-11 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 rounded-lg"
              >
                {postComment.isPending ? 'Posting...' : 'Post Comment'}
              </Button>
              {commentError && (
                <span className="text-red-500 text-xs font-medium">
                  {commentError}
                </span>
              )}
            </div>
          </form>
        </div>

        <Separator className="bg-gray-100" />
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Comments
          </h4>

          {commentsLoading ? (
            <div className="text-muted-foreground text-sm">
              Loading comments...
            </div>
          ) : comments && comments.length > 0 ? (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-primary text-xs">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-line">
                    {comment.content}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-muted-foreground text-sm">
              No comments yet.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

import { AnchoredThreads, FloatingThreads } from "@liveblocks/react-tiptap";
import { Comment, Composer, Icon } from "@liveblocks/react-ui";
import { Editor as TEditor } from "@tiptap/react";
import { useThreads } from "@liveblocks/react/suspense";
import { useScenario } from "@/hooks/useScenario";
import { memo, useState, useEffect } from "react";
import type { CommentData, ThreadData } from "@liveblocks/client";
import {
  useSelf,
  useAddReaction,
  useRemoveReaction,
  useMarkThreadAsResolved,
  useMarkThreadAsUnresolved,
  useRoom,
} from "@liveblocks/react";
import { addCommentReaction, removeCommentReaction } from "@/app/actions";

export function Threads({ editor }: { editor: TEditor | null }) {
  const { threads } = useThreads();

  if (!threads || !editor) {
    return null;
  }

  if (threads.length === 0) {
    return (
      <div className="hidden xl:flex text-text-lighter pt-8 flex-col gap-4 select-none ml-4 text-sm max-w-[260px] max-xl:bg-surface-elevated max-xl:border max-xl:border-border max-xl:shadow-sm max-xl:rounded-sm max-xl:p-8 max-xl:ml-0 opacity-50">
        <div className="text-text-light font-semibold text-lg">
          No comments yet
        </div>
        <p className="max-xl:inline-flex max-xl:items-center">
          Create a comment by selecting text and pressing the{" "}
          <Icon.Comment className="inline -mt-0.5" /> Comment button.
        </p>
      </div>
    );
  }

  return (
    <>
      <AnchoredThreads
        threads={threads}
        editor={editor}
        className="w-[350px] hidden xl:block"
        components={{
          Thread: CustomThread,
        }}
      />
      <FloatingThreads
        editor={editor}
        threads={threads}
        className="w-[350px] block xl:hidden !overflow-visible !shadow-none"
        components={{
          Thread: CustomThread,
        }}
      />
    </>
  );
}

const CustomThread = memo(function CustomThread({
  thread,
}: {
  thread: ThreadData;
}) {
  const markThreadAsResolved = useMarkThreadAsResolved();
  const markThreadAsUnresolved = useMarkThreadAsUnresolved();
  const { scenario } = useScenario();

  return (
    <div className="shadow-lg border rounded-sm overflow-hidden">
      {scenario === "writer" && (
        <div className="bg-neutral-50 border-b px-4 py-3 text-sm text-neutral-600 font-medium flex justify-between items-center">
          Unresolved comment
          <button
            className="flex items-center gap-2 text-sm text-neutral-600 font-medium"
            onClick={() => {
              if (thread.resolved) {
                markThreadAsUnresolved(thread.id);
              } else {
                markThreadAsResolved(thread.id);
              }
            }}
          >
            {thread.resolved ? <Icon.Check /> : <Icon.CheckCircle />}
          </button>
        </div>
      )}

      {thread.comments.map((comment) => (
        <CustomComment key={comment.id} comment={comment} />
      ))}
      {scenario !== "guest" && (
        <Composer threadId={thread.id} className="border-t" />
      )}
    </div>
  );
});

const CustomComment = memo(function CustomComment({
  comment,
}: {
  comment: CommentData;
}) {
  const { scenario } = useScenario();

  if (comment.deletedAt) {
    return null;
  }

  return (
    <div className="">
      <Comment
        className="!pb-16"
        comment={comment}
        showReactions={false}
        indentContent={true}
      />
      <div className="px-16 pb-6 pt-0.5 -mt-15 z-10 relative">
        {scenario === "guest" ? (
          <AnonymousReaction comment={comment} />
        ) : (
          <AuthenticatedReaction comment={comment} />
        )}
      </div>
    </div>
  );
});

function AuthenticatedReaction({ comment }: { comment: CommentData }) {
  const currentId = useSelf((me) => me.id);
  const upvoteUsers = comment.reactions.filter((r) => r.emoji === "⬆️")?.[0]
    ?.users;
  const hasUpvoted = upvoteUsers
    ? upvoteUsers.some((u) => u.id === currentId)
    : false;

  const addReaction = useAddReaction();
  const removeReaction = useRemoveReaction();
  const reactionObject = {
    threadId: comment.threadId,
    commentId: comment.id,
    emoji: "⬆️",
  };

  return (
    <button
      className="flex h-11 w-15 justify-center items-center gap-1.5 rounded-full border border-solid border-gray-200 text-base text-gray-400 not-disabled:hover:bg-gray-100 data-[picked]:border-blue-300 data-[picked]:bg-blue-50 data-[picked]:text-blue-600"
      data-picked={hasUpvoted || undefined}
      onClick={() =>
        hasUpvoted
          ? removeReaction(reactionObject)
          : addReaction(reactionObject)
      }
    >
      ▲ <span className="text-xs tabular-nums">{upvoteUsers?.length || 0}</span>
    </button>
  );
}

// Anonymous users can't use the useAddReaction hook as they don't have access
// to write comments, so we're using the Node.js API instead
function AnonymousReaction({ comment }: { comment: CommentData }) {
  const [hasReacted, setHasReacted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reactionCount, setReactionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const roomId = useRoom().id;
  const currentUserId = useSelf((me) => me.id);

  // Get initial reaction count from the comment
  useEffect(() => {
    const upvoteReaction = comment.reactions.find((r) => r.emoji === "⬆️");
    setReactionCount(upvoteReaction?.users?.length || 0);
  }, [comment.reactions]);

  const handleReactionClick = async () => {
    if (!currentUserId) {
      setError("User ID not available");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      if (hasReacted) {
        // Remove reaction
        const result = await removeCommentReaction(
          roomId,
          comment.threadId,
          comment.id,
          "⬆️",
          currentUserId
        );

        if (result.success) {
          setReactionCount((prev) => Math.max(0, prev - 1));
          setHasReacted(false);
        } else {
          setError(result.error || "Failed to remove reaction");
        }
      } else {
        // Add reaction
        const result = await addCommentReaction(
          roomId,
          comment.threadId,
          comment.id,
          "⬆️",
          currentUserId
        );

        if (result.success) {
          setReactionCount((prev) => prev + 1);
          setHasReacted(true);
        } else if (result.error === "Reaction already exists") {
          // If reaction already exists, treat as success
          setReactionCount((prev) => prev + 1);
          setHasReacted(true);
        } else {
          setError(result.error || "Failed to add reaction");
        }
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      setError("Failed to update reaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start justify-start">
      <button
        className="flex h-11 w-15 justify-center items-center gap-1.5 rounded-full border border-solid border-gray-200 text-base text-gray-400 not-disabled:hover:bg-gray-100 data-[picked]:border-blue-300 data-[picked]:bg-blue-50 data-[picked]:text-blue-600 disabled:opacity-50"
        data-picked={hasReacted || undefined}
        onClick={handleReactionClick}
        disabled={isLoading}
        title={error || (hasReacted ? "Remove reaction" : "Add reaction")}
      >
        {isLoading ? (
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full" />
        ) : (
          <>
            ▲ <span className="text-xs tabular-nums">{reactionCount}</span>
          </>
        )}
      </button>
    </div>
  );
}

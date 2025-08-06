import { Room } from "@/app/Room";
import { TextEditor } from "@/components/TextEditor";

export default async function RoomPage({ params }: any) {
  const { roomId } = await params;

  return (
    <main>
      <Room roomId={roomId}>
        <TextEditor />
      </Room>
    </main>
  );
}

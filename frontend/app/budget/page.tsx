import { Chat } from "@/components/nigeria/chat";
import { Planner } from "@/components/nigeria/planner";

export const dynamic = "force-dynamic";
export const metadata = { title: "Project Intelligence" };

export default function Page() {
  return (
    <>
      <Chat />
      <div className="mt-10">
        <Planner />
      </div>
    </>
  );
}

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from("todos").select();

  return (
    <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-stone-900">Supabase Connected Demonstration</h2>
        <p className="text-xs text-stone-500">
          Querying remote PostgreSQL instance via @supabase/ssr server client.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <span className="font-semibold">Notice:</span> Table &apos;todos&apos; query status:{" "}
          {error.message}. (Create the &apos;todos&apos; table in your Supabase dashboard to
          populate records).
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 text-xs">
          {todos && todos.length > 0 ? (
            todos.map((todo) => (
              <li key={todo.id} className="py-2.5 font-medium text-stone-800">
                {todo.name || todo.title || JSON.stringify(todo)}
              </li>
            ))
          ) : (
            <li className="py-4 text-stone-400">No records found in &apos;todos&apos; table.</li>
          )}
        </ul>
      )}
    </div>
  );
}

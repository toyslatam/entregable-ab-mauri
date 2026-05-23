import { createFileRoute } from "@tanstack/react-router";
import { PanaderiasTable } from "@/components/PanaderiasTable";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "ENTREGABLE AB MAURI" },
      { name: "description", content: "Consulta de datos por ID y ciudad." },
    ],
  }),
});

function Index() {
  return (
    <div>
      <PanaderiasTable />
    </div>
  );
}

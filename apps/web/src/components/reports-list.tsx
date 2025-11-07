import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Report } from "@/types/reports";

export function ReportsList() {
  const [search, setSearch] = useState("");
  
  //TODO: replace with API call
  const reports: Report[] = [
    { id: "1", title: "Broken streetlight", status: "pending" },
    { id: "2", title: "Pothole on Main St", status: "in_progress" },
    { id: "3", title: "Graffiti removal needed", status: "resolved" },
  ];

  const filtered = reports.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {filtered.map((report) => (
          <button
            key={report.id}
            className="w-full rounded-md border bg-card p-3 text-left hover:bg-accent"
          >
            <p className="font-medium">{report.title}</p>
            <p className="text-xs text-muted-foreground">{report.status}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
import { isFriday } from "date-fns";
import { AlertTriangle, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function FridayReportReminder() {
  const today = new Date();
  
  if (!isFriday(today)) {
    return null;
  }

  return (
    <Link to="/team/weekly-report">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 rounded-lg shadow-lg animate-pulse cursor-pointer hover:from-amber-600 hover:to-orange-600 transition-all">
        <div className="flex items-center justify-center gap-3">
          <AlertTriangle className="h-5 w-5 animate-bounce" />
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-semibold">Weekly Report Due Today!</span>
          </div>
          <span className="text-sm opacity-90">Submit by 6 PM →</span>
        </div>
      </div>
    </Link>
  );
}

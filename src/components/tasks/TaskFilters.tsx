import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X, User } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
}

interface Goal {
  id: string;
  name: string;
}

interface Filters {
  status: string;
  priority: string;
  assignee: string;
  list: string;
}

interface TaskFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  teamMembers: TeamMember[];
  todoLists: Goal[]; // Keep prop name for backwards compatibility
  currentMemberId?: string;
}

export default function TaskFilters({
  filters,
  onFiltersChange,
  teamMembers,
  todoLists,
  currentMemberId,
}: TaskFiltersProps) {
  const hasActiveFilters =
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.assignee !== 'all' ||
    filters.list !== 'all';

  const isMyTasksActive = currentMemberId && filters.assignee === currentMemberId;

  const clearFilters = () => {
    onFiltersChange({
      status: 'all',
      priority: 'all',
      assignee: 'all',
      list: 'all',
    });
  };

  const toggleMyTasks = () => {
    if (isMyTasksActive) {
      onFiltersChange({ ...filters, assignee: 'all' });
    } else if (currentMemberId) {
      onFiltersChange({ ...filters, assignee: currentMemberId });
    }
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {currentMemberId && (
        <Button
          variant={isMyTasksActive ? 'default' : 'outline'}
          size="sm"
          onClick={toggleMyTasks}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          My Tasks
        </Button>
      )}

      <Select
        value={filters.status}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="blocked">Blocked</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.priority}
        onValueChange={(value) => onFiltersChange({ ...filters, priority: value })}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assignee}
        onValueChange={(value) => onFiltersChange({ ...filters, assignee: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Assignees</SelectItem>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.list}
        onValueChange={(value) => onFiltersChange({ ...filters, list: value })}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Goal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Goals</SelectItem>
          {todoLists.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              {goal.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}

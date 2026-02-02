import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface GoalAssigneeSelectProps {
  teamMembers: TeamMember[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  currentMemberId?: string;
  disabled?: boolean;
}

export function GoalAssigneeSelect({
  teamMembers,
  selectedIds,
  onSelectionChange,
  currentMemberId,
  disabled = false,
}: GoalAssigneeSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleMember = (memberId: string) => {
    if (selectedIds.includes(memberId)) {
      onSelectionChange(selectedIds.filter((id) => id !== memberId));
    } else {
      onSelectionChange([...selectedIds, memberId]);
    }
  };

  const removeMember = (memberId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== memberId));
  };

  const selectedMembers = teamMembers.filter((m) => selectedIds.includes(m.id));

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedIds.length === 0
              ? 'Select team members...'
              : `${selectedIds.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search team members..." />
            <CommandList>
              <CommandEmpty>No team members found.</CommandEmpty>
              <CommandGroup>
                {teamMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    value={member.name}
                    onSelect={() => toggleMember(member.id)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedIds.includes(member.id) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex flex-col">
                      <span>
                        {member.name}
                        {member.id === currentMemberId && (
                          <span className="text-muted-foreground ml-1">(you)</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">{member.email}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedMembers.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedMembers.map((member) => (
            <Badge key={member.id} variant="secondary" className="gap-1 pr-1">
              {member.name}
              <button
                type="button"
                onClick={() => removeMember(member.id)}
                className="ml-1 rounded-full hover:bg-muted p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

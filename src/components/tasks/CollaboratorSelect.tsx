import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
}

interface CollaboratorSelectProps {
  teamMembers: TeamMember[];
  onAdd: (memberId: string, roleDescription: string) => void;
}

export default function CollaboratorSelect({ teamMembers, onAdd }: CollaboratorSelectProps) {
  const [selectedMember, setSelectedMember] = useState('');
  const [roleDescription, setRoleDescription] = useState('');

  const handleAdd = () => {
    if (!selectedMember) return;
    onAdd(selectedMember, roleDescription);
    setSelectedMember('');
    setRoleDescription('');
  };

  if (teamMembers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        All team members are already collaborators.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <Select value={selectedMember} onValueChange={setSelectedMember}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select member" />
        </SelectTrigger>
        <SelectContent>
          {teamMembers.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        value={roleDescription}
        onChange={(e) => setRoleDescription(e.target.value)}
        placeholder="Their role (optional)"
        className="flex-1"
      />

      <Button onClick={handleAdd} disabled={!selectedMember} size="icon">
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  );
}

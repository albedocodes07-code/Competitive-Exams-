export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function getExamFullName(category: string): string {
  switch (category) {
    case 'CSS':
      return 'Central Superior Services (CSS)';
    case 'PMS':
      return 'Provincial Management Service (PMS)';
    case 'PPSC':
      return 'Punjab Public Service Commission (PPSC)';
    case 'FPSC':
      return 'Federal Public Service Commission (FPSC)';
    default:
      return category;
  }
}

export function getExamBadgeColor(category: string): { bg: string; text: string; border: string } {
  switch (category) {
    case 'CSS':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' };
    case 'PMS':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' };
    case 'PPSC':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' };
    case 'FPSC':
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' };
  }
}

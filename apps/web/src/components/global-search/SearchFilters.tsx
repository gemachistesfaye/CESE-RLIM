import { SearchEntityType } from '../../hooks/useGlobalSearch';

const FILTER_TYPES: { value: SearchEntityType; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'RESEARCHER', label: 'Researchers' },
  { value: 'PROJECT', label: 'Projects' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'LABORATORY', label: 'Labs' },
  { value: 'PUBLICATION', label: 'Publications' },
  { value: 'DOCUMENT', label: 'Documents' },
  { value: 'INNOVATION', label: 'Innovations' },
  { value: 'FUNDING', label: 'Funding' },
  { value: 'GRANT', label: 'Grants' },
  { value: 'ETHICS', label: 'Ethics' },
  { value: 'EVENT', label: 'Events' },
  { value: 'MILESTONE', label: 'Milestones' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'ACTIVITY', label: 'Activities' },
];

interface SearchFiltersProps {
  selectedType: SearchEntityType;
  onTypeChange: (type: SearchEntityType) => void;
  sort: 'relevance' | 'recent';
  onSortChange: (sort: 'relevance' | 'recent') => void;
}

export default function SearchFilters({
  selectedType,
  onTypeChange,
  sort,
  onSortChange,
}: SearchFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1">
        {FILTER_TYPES.map((filter) => (
          <button
            key={filter.value}
            onClick={() => onTypeChange(filter.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedType === filter.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>
      <div className="ml-auto">
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as 'relevance' | 'recent')}
          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="relevance">Relevance</option>
          <option value="recent">Most Recent</option>
        </select>
      </div>
    </div>
  );
}

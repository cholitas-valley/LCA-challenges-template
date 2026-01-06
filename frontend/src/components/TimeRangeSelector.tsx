interface TimeRangeSelectorProps {
  selected: number;
  onChange: (hours: number) => void;
}

type TimeRangeOption = {
  label: string;
  hours: number;
};

const TIME_RANGES: TimeRangeOption[] = [
  { label: '1h', hours: 1 },
  { label: '6h', hours: 6 },
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
];

export function TimeRangeSelector({ selected, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex space-x-2">
      {TIME_RANGES.map((range) => {
        const isActive = selected === range.hours;
        const activeClasses = 'bg-green-600 text-white';
        const inactiveClasses = 'bg-gray-100 text-gray-700 hover:bg-gray-200';
        const classes = isActive ? activeClasses : inactiveClasses;
        return (
          <button
            key={range.hours}
            onClick={() => onChange(range.hours)}
            className={'px-4 py-2 rounded-md text-sm font-medium transition-colors ' + classes}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}

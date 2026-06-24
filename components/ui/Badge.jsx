const VARIANTS = {
  active:    'bg-green-100 text-green-700',
  returned:  'bg-gray-100  text-gray-600',
  overdue:   'bg-red-100   text-red-700',
  suspended: 'bg-orange-100 text-orange-700',
  premium:   'bg-purple-100 text-purple-700',
  standard:  'bg-blue-100  text-blue-700',
};

export default function Badge({ label, variant }) {
  return (
    <span className={`badge ${VARIANTS[variant] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

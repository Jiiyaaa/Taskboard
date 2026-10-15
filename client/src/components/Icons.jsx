/* oxlint-disable react/only-export-components */
// Small inline SVG icon set (24x24 grid, stroke-based) so we need no icon library.
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

const make = (children) =>
  function Icon(props) {
    return (
      <svg {...base} {...props}>
        {children}
      </svg>
    )
  }

export const PlusIcon = make(<path d="M12 5v14M5 12h14" />)
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </>,
)
export const TrashIcon = make(
  <>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
    <path d="M10 11v6M14 11v6" />
  </>,
)
export const EditIcon = make(
  <>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </>,
)
export const CalendarIcon = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
)
export const ActivityIcon = make(<path d="M3 12h4l3-8 4 16 3-8h4" />)
export const SunIcon = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </>,
)
export const MoonIcon = make(<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />)
export const XIcon = make(<path d="M6 6l12 12M18 6 6 18" />)
export const AlertIcon = make(
  <>
    <path d="M12 3 2 21h20L12 3Z" />
    <path d="M12 10v5M12 18h.01" />
  </>,
)
export const InboxIcon = make(
  <>
    <path d="M3 13h5l1.5 3h5L16 13h5" />
    <path d="M5 5h14l2 8v6H3v-6Z" />
  </>,
)
export const SearchOffIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5M8.5 8.5l5 5M13.5 8.5l-5 5" />
  </>,
)

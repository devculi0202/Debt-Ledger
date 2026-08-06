export default function LedgerIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden="true"
    >
      {/* Ledger book with side tabs; $ punched out */}
      <path d="M4 3.2C4 2.537 4.537 2 5.2 2h11.1c.663 0 1.2.537 1.2 1.2V5h1.05c.386 0 .7.314.7.7v1.6c0 .386-.314.7-.7.7H17.5v1.2h1.05c.386 0 .7.314.7.7v1.6c0 .386-.314.7-.7.7H17.5v1.2h1.05c.386 0 .7.314.7.7v1.6c0 .386-.314.7-.7.7H17.5v2.55c0 .663-.537 1.2-1.2 1.2H5.2c-.663 0-1.2-.537-1.2-1.2V3.2zm7.2 5.05h1.6v1.15h1.15a.75.75 0 0 1 0 1.5H12.8v1.4h1.15a.75.75 0 0 1 0 1.5H12.8V15.1h-1.6v-1.25H10.05a.75.75 0 0 1 0-1.5H11.2v-1.4H10.05a.75.75 0 0 1 0-1.5H11.2z" />
    </svg>
  )
}

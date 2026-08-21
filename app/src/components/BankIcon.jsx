export const banks = [
  { id: 'bri', name: 'BRI', account: '88810081332108131', color: '#004E8E' },
  { id: 'bca', name: 'BCA', account: '3901081332108131', color: '#0060AF' },
  { id: 'bni', name: 'BNI', account: '8810081332108131', color: '#F57920' },
  { id: 'btn', name: 'BTN', account: '8528081332108131', color: '#0B5CAD' },
  { id: 'jatim', name: 'Bank Jatim', account: '8528081332108131', color: '#009247' },
  { id: 'cimb', name: 'CIMB Niaga', account: '8059081332108131', color: '#E11B22' },
  { id: 'mandiri', name: 'Mandiri', account: '89508081332108131', color: '#002C77' },
]

const textStyle = {
  textAnchor: 'middle',
  fill: '#FFFFFF',
  fontWeight: 700,
  fontFamily: 'Arial, Helvetica, sans-serif',
}

const logos = {
  bri: (
    <>
      <path d="M12 21 C18 14 30 14 36 21" stroke="#FFD100" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text x="24" y="35" fontSize="14" style={textStyle}>BRI</text>
    </>
  ),
  bca: (
    <>
      <g stroke="#FFD100" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="24" cy="13" r="4.5" fill="#FFD100" stroke="none" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(0 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(45 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(90 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(135 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(180 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(225 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(270 24 13)" />
        <line x1="24" y1="4.5" x2="24" y2="8.5" transform="rotate(315 24 13)" />
      </g>
      <text x="24" y="36" fontSize="13" style={textStyle}>BCA</text>
    </>
  ),
  bni: (
    <>
      <path d="M12 21 C18 14 30 14 36 21" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <text x="24" y="35" fontSize="14" style={textStyle}>BNI</text>
    </>
  ),
  btn: (
    <>
      <path d="M17 22 L24 15.5 L31 22" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 22 V27 H32 V22" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="24" y="39" fontSize="11" style={textStyle}>BTN</text>
    </>
  ),
  jatim: (
    <>
      <path d="M13 25 C17 17 31 17 35 25" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.9" />
      <path d="M13 25 C17 30 31 30 35 25" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
      <text x="24" y="39" fontSize="10" style={textStyle}>JATIM</text>
    </>
  ),
  cimb: (
    <>
      <text x="24" y="28" fontSize="12" style={{ ...textStyle, fontWeight: 800 }}>CIMB</text>
      <text x="24" y="38" fontSize="8" letterSpacing="1.5" style={textStyle}>NIAGA</text>
    </>
  ),
  mandiri: (
    <>
      <path d="M14 26 H18 L21 21 L24 26 L27 21 L30 26 H34" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="24" y="38" fontSize="12" style={textStyle}>Mandiri</text>
    </>
  ),
}

export default function BankIcon({ bank, size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className="bank-icon"
      role="img"
      aria-label={`Logo ${bank.name}`}
    >
      <rect width="48" height="48" rx="9" fill={bank.color} />
      {logos[bank.id]}
    </svg>
  )
}

// AnimatedDropdown — wrapper AnimatePresence untuk dropdown/menu/panel
// yang kembang-kempis dengan animasi smooth (fade + slide vertikal).
// Bungkus konten yang di-render kondisional di dalamnya, mis:
//   {open && <AnimatedDropdown>...children...</AnimatedDropdown>}
// Maka saat `open` berubah false, animasi exit diputar dulu baru unmount.
import { AnimatePresence, motion } from 'framer-motion'

export default function AnimatedDropdown({ children, show, duration = 0.18 }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.97 }}
          transition={{ duration, ease: 'easeOut' }}
          style={{ transformOrigin: 'top left' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
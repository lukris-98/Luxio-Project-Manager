import { motion } from 'framer-motion'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import './FAQ.css'

const faqs = [
  { 
    q: 'Apa itu Luxio?', 
    a: 'Luxio adalah aplikasi untuk mengelola target dan project tim. Bisa digunakan untuk personal, keluarga, sekolah, instansi pemerintah, maupun perusahaan. Semua data tersimpan aman di database Neon.' 
  },
  { 
    q: 'Bagaimana cara mulai?', 
    a: 'Cukup daftar gratis, lalu setup perusahaan/sekolah/keluarga kamu. Tanpa kartu kredit! Langsung bisa buat target dan undang anggota.' 
  },
  { 
    q: 'Apakah data aman?', 
    a: 'Sangat aman. Kami menggunakan Neon PostgreSQL yang sudah terenkripsi. Data kamu tidak akan dibagikan ke pihak ketiga.' 
  },
  { 
    q: 'Bisa untuk personal saja?', 
    a: 'Bisa! Plan Personal gratis untuk 1 orang. Cocok untuk mahasiswa, freelancer, atau siapa saja yang ingin mengelola target pribadi.' 
  },
  { 
    q: 'Apakah tersedia untuk sekolah?', 
    a: 'Ya! Plan Sekolah khusus untuk lembaga pendidikan. Bisa manage guru, siswa, kelas, dan laporan perkembangan.' 
  },
  { 
    q: 'Apakah bisa untuk instansi pemerintah?', 
    a: 'Bisa! Plan Instansi untuk pemerintah atau lembaga negara. Includes unlimited users, multi-divisi, dan dedicated support.' 
  },
  { 
    q: 'Bagaimana dengan rencana keluarga?', 
    a: 'Plan Keluarga bisa untuk sampai 5 anggota. Cocok untuk mengelola target bersama keluarga, dari anak-anak sampai dewasa.' 
  },
  { 
    q: 'Apakah ada gratis?', 
    a: 'Ya! Plan Personal gratis forever untuk 1 user. Tidak perlu kartu kredit. Juga ada trial 14 hari untuk plan lain.' 
  },
  { 
    q: 'Bagaimana jika butuh bantuan?', 
    a: 'Bisa email ke hello@luxio.id. Untuk plan Pro ke atas dapat priority support.' 
  },
]

export default function FAQ() {
  return (
    <div className="faq-page">
      <div className="faq-header">
        <a href="/" className="back-link">
          <ArrowLeft size={18} /> Kembali
        </a>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Pertanyaan Umum
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Jawaban untuk pertanyaan yang sering diajukan
        </motion.p>
      </div>

      <div className="faq-grid">
        {faqs.map((faq, idx) => (
          <motion.div 
            key={idx}
            className="faq-item"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <h4>{faq.q}</h4>
            <p>{faq.a}</p>
          </motion.div>
        ))}
      </div>

      <div className="faq-contact">
        <MessageCircle size={24} />
        <p>Tidak найден ответ yang kamu cari?</p>
        <a href="mailto:hello@luxio.id" className="btn btn-primary">
          Hubungi Kami
        </a>
      </div>
    </div>
  )
}
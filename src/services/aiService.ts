import { GoogleGenAI } from "@google/genai";

export class AiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
    }
  }

  async analyzeFinances(transactions: any[], profile: any) {
    if (!this.ai) {
      throw new Error("GEMINI_API_KEY tidak ditemukan. Harap konfigurasi di panel Secrets AI Studio.");
    }

    const summary = transactions.reduce((acc, t) => {
      const amount = t.jumlah || t.amount || 0;
      if (t.type === 'pemasukan') acc.pemasukan += amount;
      else acc.pengeluaran += amount;
      return acc;
    }, { pemasukan: 0, pengeluaran: 0 });

    const prompt = `
      Anda adalah asisten keuangan profesional untuk aplikasi KASPRO.
      Nama Pengguna: ${profile?.nama || 'User'}
      Ringkasan Keuangan:
      - Total Pemasukan: Rp ${summary.pemasukan.toLocaleString()}
      - Total Pengeluaran: Rp ${summary.pengeluaran.toLocaleString()}
      - Saldo Saat Ini: Rp ${(summary.pemasukan - summary.pengeluaran).toLocaleString()}

      Daftar Transaksi Terakhir:
      ${transactions.slice(0, 10).map(t => `- ${t.type.toUpperCase()}: Rp ${(t.jumlah || t.amount || 0).toLocaleString()} (${t.kategori || t.category || 'Lainnya'}) - ${t.keterangan || t.description}`).join('\n')}

      Berikan 3 saran singkat dan motivasi keuangan yang bersemangat untuk pengguna ini berdasarkan data di atas. 
      Gunakan bahasa Indonesia yang santai tapi profesional.
      Format output: JSON dengan field "advice" (array string) dan "mood" (string, motivasi singkat).
    `;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error("AI Analysis Error:", error);
      throw error;
    }
  }
}

export const aiService = new AiService();

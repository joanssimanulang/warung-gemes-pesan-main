export const formatRupiah = (n: number) =>
  "Rp " + new Intl.NumberFormat("id-ID").format(Math.round(n));

export const statusLabel = (s: string) => ({
  menunggu: "Menunggu",
  diproses: "Diproses",
  selesai: "Selesai",
  menunggu_pembayaran: "Menunggu Pembayaran",
  dibayar: "Dibayar",
  gagal: "Gagal",
}[s] ?? s);

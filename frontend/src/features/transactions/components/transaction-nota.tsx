import React from "react";
import { FinancialLog } from "../types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";

interface TransactionNotaProps {
  transaction: FinancialLog;
  options: {
    includeMedia: boolean;
    includeHeader: boolean;
    includeFooter: boolean;
  };
}

export const TransactionNota = React.forwardRef<HTMLDivElement, TransactionNotaProps>(
  ({ transaction, options }, ref) => {
    const { organization, items, type, totalAmount, user } = transaction;

    return (
      <div ref={ref} className="hidden print:block p-8 max-w-[210mm] mx-auto bg-white text-black font-sans box-border" style={{ marginLeft: "auto", marginRight: "auto" }}>
        
        {/* Header / Kop Surat */}
        {options.includeHeader && (
          <div className="border-b-2 border-black pb-4 mb-6 flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex items-center gap-4">
                  {organization.logo && (
                      <div className="w-20 h-20 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                              src={organization.logo} 
                              alt="Logo" 
                              className="w-full h-full object-contain"
                          />
                      </div>
                  )}
                  <div>
                      <h1 className="text-2xl font-bold uppercase tracking-wider">{organization.name}</h1>
                      <div className="text-sm space-y-1 mt-1 text-gray-700">
                           {organization.address && <p>{organization.address}</p>}
                           <div className="flex gap-4">
                               {organization.phone && <p>Telp: {organization.phone}</p>}
                               {organization.email && <p>Email: {organization.email}</p>}
                           </div>
                           {organization.website && <p className="text-blue-800 underline">{organization.website}</p>}
                      </div>
                  </div>
              </div>
              <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-900 border-2 border-gray-900 px-4 py-1 inline-block">
                    {type === "INCOME" ? "BUKTI MASUK" : "BUKTI KELUAR"}
                  </h2>
                  <p className="mt-2 text-sm font-mono">{transaction.id.split('-')[0].toUpperCase()}</p>
              </div>
          </div>
        )}

        {/* Info Transaksi */}
        <div className="grid grid-cols-2 gap-8 mb-8 text-sm">
            <div>
                <table className="w-full">
                    <tbody>
                        <tr>
                            <td className="font-semibold w-32 py-1">Tanggal</td>
                            <td>: {transaction.transactionDate && !isNaN(new Date(transaction.transactionDate).getTime()) 
                              ? format(new Date(transaction.transactionDate), "dd MMMM yyyy", { locale: idLocale }) 
                              : "-"}</td>
                        </tr>
                        <tr>
                            <td className="font-semibold py-1">Dibuat Oleh</td>
                            <td>: {user.name}</td>
                        </tr>
                        <tr>
                            <td className="font-semibold py-1">Divisi</td>
                            <td>: {organization.slug.toUpperCase()}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div>
                 <div className="bg-gray-50 border p-4 rounded-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Total Transaksi</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
                 </div>
            </div>
        </div>

        {/* Deskripsi Utama */}
        <div className="mb-6">
            <h3 className="text-sm font-bold border-b border-black mb-2 pb-1">KETERANGAN</h3>
            <p className="p-2 border border-dashed border-gray-300 min-h-[60px]">{transaction.description}</p>
        </div>

        {/* Tabel Items */}
        {items && items.length > 0 && (
            <div className="mb-8">
                <h3 className="text-sm font-bold border-b border-black mb-2 pb-1">RINCIAN ITEM</h3>
                <table className="w-full text-sm border-collapse">
                    <thead>
                        <tr className="bg-gray-100 border-y border-gray-300">
                            <th className="text-left py-2 px-2">Deskripsi Item</th>
                            <th className="text-center py-2 px-2 w-20">Qty</th>
                            <th className="text-right py-2 px-2 w-32">Harga Satuan</th>
                            <th className="text-right py-2 px-2 w-36">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, idx) => (
                            <tr key={item.id} className="border-b border-gray-200">
                                <td className="py-2 px-2">{item.itemName}</td>
                                <td className="text-center py-2 px-2">{item.quantity}</td>
                                <td className="text-right py-2 px-2">{formatCurrency(item.unitPrice)}</td>
                                <td className="text-right py-2 px-2 font-medium">{formatCurrency(item.subTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="font-bold border-t border-black text-base">
                            <td colSpan={3} className="text-right py-3 px-2">TOTAL</td>
                            <td className="text-right py-3 px-2">{formatCurrency(totalAmount)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        )}

        {/* Attachments / Media */}
        {options.includeMedia && transaction.attachments && transaction.attachments.length > 0 && (
            <div className="mb-8 break-inside-avoid">
                 <h3 className="text-sm font-bold border-b border-black mb-4 pb-1">LAMPIRAN / BUKTI FISIK</h3>
                 <div className="grid grid-cols-2 gap-4">
                     {transaction.attachments.map(att => (
                         att.mimeType.startsWith("image/") && (
                             <div key={att.id} className="border p-2">
                                 {/* eslint-disable-next-line @next/next/no-img-element */}
                                 <img src={att.url} alt={att.fileName} className="max-h-[200px] w-auto mx-auto object-contain" />
                                 <p className="text-center text-xs mt-1 text-gray-500">{att.fileName}</p>
                             </div>
                         )
                     ))}
                 </div>
            </div>
        )}

        {/* Footer / Tanda Tangan */}
        {options.includeFooter && (
            <div className="grid grid-cols-3 gap-4 mt-12 text-center text-sm break-inside-avoid">
                <div>
                    <p className="mb-16">Penyetor / Penerima</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                    <p className="text-xs mt-1 italic">( Nama Terang )</p>
                </div>
                <div>
                    <p className="mb-16">Mengetahui</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                    <p className="text-xs mt-1 italic">( Atasan / Pimpinan )</p>
                </div>
                <div>
                    <p className="mb-16">Dibuat Oleh</p>
                    <div className="border-t border-black w-3/4 mx-auto"></div>
                    <p className="text-xs mt-1 font-bold">{user.name}</p>
                </div>
            </div>
        )}
        
        <div className="text-center text-[10px] text-gray-400 mt-12 print:fixed print:bottom-4 print:left-0 print:right-0">
             Printed from UCH SuperApp on {format(new Date(), "PPpp")}
        </div>
      </div>
    );
  }
);

TransactionNota.displayName = "TransactionNota";

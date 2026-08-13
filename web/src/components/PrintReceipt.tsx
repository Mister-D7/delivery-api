import { useRef } from 'react';
import { Printer, FileDown } from '../components/adminIcons';
import jsPDF from 'jspdf';
import i18n from '../i18n';

const STATUS_LABEL_KEYS: Record<string, string> = {
  PENDING: 'pending', CONFIRMED: 'confirmed', PREPARING: 'preparing',
  ON_THE_WAY: 'out_for_delivery', DELIVERED: 'delivered', CANCELLED: 'cancelled',
};
export function statusLabel(status: string): string {
  const key = STATUS_LABEL_KEYS[status];
  return key ? i18n.t(key, { ns: 'order-status' }) : status;
}

type OrderItem = {
  customName?: string | null;
  product?: { name: string; imageUrl?: string | null } | null;
  quantity: number;
  unitPrice: number;
};

type Order = {
  id: string;
  secureToken?: string;
  status: string;
  customerName: string;
  phone: string;
  address?: string | null;
  total: number;
  deliveryFee?: number;
  createdAt: string;
  items: OrderItem[];
};

function generatePDF(order: Order) {
  const doc = new jsPDF();
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(191, 162, 78);
  doc.rect(0, 0, pageW, 40, 'F');
  doc.setTextColor(10, 10, 10);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('HYBRIDGE Delivery', pageW / 2, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Commande #${order.id.slice(0, 8)}`, pageW / 2, 28, { align: 'center' });
  doc.text(new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }), pageW / 2, 34, { align: 'center' });

  y = 50;

  // Customer info
  doc.setFontSize(9);
  doc.setTextColor(140, 133, 120);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT', 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.text(`Nom: ${order.customerName}`, 14, y); y += 5;
  doc.text(`Telephone: ${order.phone}`, 14, y); y += 5;
  if (order.address) { doc.text(`Adresse: ${order.address}`, 14, y); y += 5; }
  doc.text(`Statut: ${statusLabel(order.status)}`, 14, y); y += 10;

  // Table header
  doc.setFillColor(245, 240, 224);
  doc.rect(14, y - 4, pageW - 28, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(140, 133, 120);
  doc.text('Produit', 16, y + 1);
  doc.text('Qte', 120, y + 1);
  doc.text('Prix', 138, y + 1);
  doc.text('Total', 168, y + 1);
  y += 10;

  // Items
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  for (const item of order.items) {
    const name = item.customName || item.product?.name || 'Produit';
    const lineTotal = item.unitPrice * item.quantity;
    doc.text(name.slice(0, 30), 16, y);
    doc.text(String(item.quantity), 122, y);
    doc.text(`${item.unitPrice} DA`, 138, y);
    doc.text(`${lineTotal} DA`, 166, y);
    y += 6;

    // Separator
    doc.setDrawColor(230, 230, 230);
    doc.line(16, y - 2, pageW - 16, y - 2);
  }

  y += 4;

  // Totals
  const itemsTotal = order.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const deliveryFee = order.deliveryFee ?? (order.total - itemsTotal);

  doc.setFontSize(9);
  doc.text('Sous-total:', 130, y);
  doc.text(`${itemsTotal} DA`, 166, y); y += 6;
  doc.text('Livraison:', 130, y);
  doc.text(deliveryFee === 0 ? 'Gratuit' : `${deliveryFee} DA`, 166, y); y += 8;

  // Grand total
  doc.setFillColor(191, 162, 78);
  doc.rect(14, y - 5, pageW - 28, 10, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 10, 10);
  doc.text('TOTAL', 16, y + 1);
  doc.text(`${order.total} DA`, 166, y + 1);

  y += 18;

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(160, 160, 160);
  doc.text('Merci pour votre commande! - HYBRIDGE - hybridge.dz', pageW / 2, y, { align: 'center' });

  doc.save(`recu-${order.id.slice(0, 8)}.pdf`);
}

export function DownloadPdfButton({ order }: { order: Order }) {
  return (
    <button onClick={() => generatePDF(order)} className="p-2 rounded-lg" style={{ background: '#1a1a1a', color: '#8c8578' }} title="Télécharger le PDF">
      <FileDown size={14} />
    </button>
  );
}

export default function PrintReceipt({ order }: { order: Order }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>Recu - ${order.id.slice(0, 8)}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1a1a1a; }
        .header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #bfa24e; padding-bottom: 12px; }
        .header h2 { font-size: 18px; color: #bfa24e; margin-bottom: 4px; }
        .header p { font-size: 11px; color: #666; }
        .info { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 14px; font-size: 12px; }
        .info span { color: #666; }
        .info strong { color: #1a1a1a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 12px; }
        th { background: #f5f0e0; padding: 6px 8px; text-align: left; font-size: 11px; color: #8c8578; text-transform: uppercase; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 8px; text-align: right; font-size: 12px; }
        .totals div { display: flex; justify-content: flex-end; gap: 16px; padding: 3px 0; }
        .totals .grand { font-size: 16px; font-weight: bold; color: #bfa24e; border-top: 2px solid #bfa24e; padding-top: 6px; margin-top: 4px; }
        .footer { text-align: center; margin-top: 16px; font-size: 10px; color: #999; border-top: 1px solid #eee; padding-top: 8px; }
        @media print { body { padding: 10px; } }
      </style></head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <>
      <button onClick={handlePrint} className="p-2 rounded-lg" style={{ background: '#1a1a1a', color: '#8c8578' }} title="Imprimer le recu">
        <Printer size={14} />
      </button>
      <div ref={printRef} className="hidden">
        <div className="header">
          <h2>HYBRIDGE Delivery</h2>
          <p>Commande #{order.id.slice(0, 8)} - {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="info">
          <div><span>Client: </span><strong>{order.customerName}</strong></div>
          <div><span>Tele: </span><strong>{order.phone}</strong></div>
          <div><span>Adresse: </span><strong>{order.address || '-'}</strong></div>
          <div><span>Statut: </span><strong>{statusLabel(order.status)}</strong></div>
        </div>
        <table>
          <thead>
            <tr><th>Produit</th><th>Qte</th><th>Prix</th><th style={{ textAlign: 'right' }}>Total</th></tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.customName || item.product?.name || 'Produit'}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice} DA</td>
                <td style={{ textAlign: 'right' }}>{item.unitPrice * item.quantity} DA</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="totals">
          <div><span>Sous-total</span><span>{order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)} DA</span></div>
          <div><span>Livraison</span><span>{(order.deliveryFee ?? 0) === 0 ? 'Gratuit' : `${order.deliveryFee} DA`}</span></div>
          <div className="grand"><span>TOTAL</span><span>{order.total} DA</span></div>
        </div>
        <div className="footer">
          Merci pour votre commande! - HYBRIDGE - hybridge.dz
        </div>
      </div>
    </>
  );
}

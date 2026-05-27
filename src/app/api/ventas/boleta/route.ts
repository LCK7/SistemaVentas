import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ventaId = searchParams.get("ventaId");

  if (!ventaId) {
    return NextResponse.json({ error: "Se requiere ventaId" }, { status: 400 });
  }

  const venta = await prisma.venta.findUnique({
    where: { id: ventaId },
    include: {
      usuario: { select: { nombre: true } },
      cliente: { select: { nombre: true, nit: true, direccion: true } },
      detalles: {
        include: { producto: { select: { nombre: true, codigo: true } } },
      },
    },
  });

  if (!venta) {
    return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
  }

  // Configurar PDF tamaño ticket (80mm x variable)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: [80, 120 + venta.detalles.length * 6],
  });

  const pageWidth = 80;
  let y = 5;

  // Línea superior
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(3, y, pageWidth - 3, y);
  y += 5;

  // Título
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("MINIMARKET", pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Av. Principal 123 - RUC: 12345678901", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.text(`Tel: 999-888-777`, pageWidth / 2, y, { align: "center" });
  y += 4;

  // Línea separadora
  doc.setDrawColor(0);
  doc.line(3, y, pageWidth - 3, y);
  y += 4;

  // Ticket número
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`BOLETA DE VENTA #${venta.numeroTicket}`, pageWidth / 2, y, { align: "center" });
  y += 5;

  // Fecha y vendedor
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Fecha: ${venta.createdAt.toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Lima"
  })}`, 5, y);
  y += 3.5;
  doc.text(`Vendedor: ${venta.usuario.nombre}`, 5, y);
  y += 3.5;
  if (venta.cliente) {
    doc.text(`Cliente: ${venta.cliente.nombre}`, 5, y);
    y += 3.5;
    if (venta.cliente.nit) {
      doc.text(`NIT: ${venta.cliente.nit}`, 5, y);
      y += 3.5;
    }
  }
  y += 2;

  // Línea separadora
  doc.setDrawColor(0);
  doc.line(3, y, pageWidth - 3, y);
  y += 3;

  // Header de productos
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("CANT", 5, y);
  doc.text("PRODUCTO", 15, y);
  doc.text("P.UNIT", 48, y);
  doc.text("SUBTOTAL", 62, y);
  y += 3.5;

  // Línea
  doc.setDrawColor(200);
  doc.line(3, y, pageWidth - 3, y);
  y += 2;

  // Productos
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  for (const det of venta.detalles) {
    doc.text(`${det.cantidad}`, 5, y);
    doc.text(det.producto.nombre.substring(0, 20), 15, y);
    doc.text(`S/ ${Number(det.precioUnit).toFixed(2)}`, 48, y);
    doc.text(`S/ ${Number(det.subtotal).toFixed(2)}`, 62, y);
    y += 4;
  }

  // Línea
  y += 1;
  doc.setDrawColor(0);
  doc.line(3, y, pageWidth - 3, y);
  y += 3;

  // Total
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: S/ ${Number(venta.total).toFixed(2)}`, pageWidth - 5, y, { align: "right" });
  y += 5;

  // Método de pago
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  const metodoLabels: Record<string, string> = {
    EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia", OTRO: "Otro",
  };
  doc.text(`Método de Pago: ${metodoLabels[venta.metodoPago] || venta.metodoPago}`, 5, y);
  y += 6;

  // Agradecimiento
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("¡Gracias por su compra!", pageWidth / 2, y, { align: "center" });
  y += 4;
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("Productos sujetos a cambio dentro de 7 días", pageWidth / 2, y, { align: "center" });
  y += 3;
  doc.text("con boleta y empaque original", pageWidth / 2, y, { align: "center" });

  // Línea inferior
  y += 4;
  doc.setDrawColor(0);
  doc.line(3, y, pageWidth - 3, y);

  // Abrir diálogo de impresión automáticamente al abrir el PDF
  doc.addJS("print()");

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=boleta-${venta.numeroTicket}.pdf`,
    },
  });
}

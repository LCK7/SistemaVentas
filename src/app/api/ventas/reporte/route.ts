import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const formato = searchParams.get("formato") || "pdf";
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");
  const usuarioId = searchParams.get("usuarioId");

  // Construir filtros
  const where: any = { estado: "COMPLETADA" };
  if (desde || hasta) {
    where.createdAt = {};
    if (desde) where.createdAt.gte = new Date(desde);
    if (hasta) where.createdAt.lte = new Date(hasta + "T23:59:59.999Z");
  }
  if (usuarioId) where.usuarioId = usuarioId;
  if (user.rol !== "ADMIN") {
    where.usuarioId = user.id;
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: {
      usuario: { select: { nombre: true } },
      cliente: { select: { nombre: true } },
      detalles: {
        include: { producto: { select: { nombre: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calcular resumen
  const totalVentas = ventas.length;
  const montoTotal = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const ticketMin = ventas.length > 0 ? Math.min(...ventas.map(v => v.numeroTicket)) : 0;
  const ticketMax = ventas.length > 0 ? Math.max(...ventas.map(v => v.numeroTicket)) : 0;

  if (formato === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte de Ventas");

    // Título
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Reporte de Ventas - MiniMarket";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center" };

    // Resumen
    sheet.addRow([]);
    sheet.addRow(["Total Ventas:", totalVentas]);
    sheet.addRow(["Monto Total:", `S/ ${montoTotal.toFixed(2)}`]);
    sheet.addRow([]);

    // Headers
    const headers = ["Ticket #", "Fecha", "Vendedor", "Cliente", "Productos", "Método Pago", "Total"];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Datos
    for (const venta of ventas) {
      sheet.addRow([
        venta.numeroTicket,
        venta.createdAt.toLocaleDateString("es-PE"),
        venta.usuario.nombre,
        venta.cliente?.nombre || "-",
        venta.detalles.reduce((s, d) => s + d.cantidad, 0),
        venta.metodoPago,
        Number(venta.total).toFixed(2),
      ]);
    }

    // Columna total
    sheet.addRow([]);
    const totalRow = sheet.addRow(["", "", "", "", "", "TOTAL:", montoTotal.toFixed(2)]);
    totalRow.font = { bold: true };

    // Ajustar ancho de columnas
    sheet.columns.forEach((col: any, i: number) => {
      col.width = [10, 14, 20, 20, 12, 14, 12][i] || 12;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=reporte-ventas-${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  }

  // PDF
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Título
  doc.setFontSize(18);
  doc.text("MiniMarket - Reporte de Ventas", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, pageWidth / 2, 28, { align: "center" });

  // Resumen
  doc.setFontSize(11);
  doc.text(`Periodo: ${desde || "Inicio"} - ${hasta || new Date().toLocaleDateString("es-PE")}`, 14, 38);
  doc.text(`Total Ventas: ${totalVentas}`, 14, 44);
  doc.text(`Monto Total: S/ ${montoTotal.toFixed(2)}`, 14, 50);
  doc.text(`Tickets: #${ticketMin} - #${ticketMax}`, 14, 56);

  // Tabla
  const tableData = ventas.map((v) => [
    `#${v.numeroTicket}`,
    v.createdAt.toLocaleDateString("es-PE"),
    v.usuario.nombre,
    v.cliente?.nombre || "-",
    v.detalles.reduce((s, d) => s + d.cantidad, 0).toString(),
    v.metodoPago,
    `S/ ${Number(v.total).toFixed(2)}`,
  ]);

  (doc as any).autoTable({
    startY: 62,
    head: [["Ticket", "Fecha", "Vendedor", "Cliente", "Items", "Pago", "Total"]],
    body: tableData,
    foot: [["", "", "", "", "", "TOTAL:", `S/ ${montoTotal.toFixed(2)}`]],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: "bold" },
  });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=reporte-ventas-${new Date().toISOString().split("T")[0]}.pdf`,
    },
  });
}

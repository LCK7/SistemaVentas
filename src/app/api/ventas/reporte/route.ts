import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";

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

  // PDF — tabla manual sin jspdf-autotable
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 10;
  const marginRight = 10;
  const colWidths = [14, 22, 30, 28, 10, 18, 28];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = marginLeft;

  // Título
  doc.setFontSize(18);
  doc.text("MiniMarket - Reporte de Ventas", pageWidth / 2, 20, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, pageWidth / 2, 28, { align: "center" });

  // Resumen
  doc.setFontSize(11);
  let y = 36;
  doc.text(`Periodo: ${desde || "Inicio"} - ${hasta || new Date().toLocaleDateString("es-PE")}`, marginLeft, y); y += 6;
  doc.text(`Total Ventas: ${totalVentas}`, marginLeft, y); y += 6;
  doc.text(`Monto Total: S/ ${montoTotal.toFixed(2)}`, marginLeft, y); y += 6;
  doc.text(`Tickets: #${ticketMin} - #${ticketMax}`, marginLeft, y); y += 8;

  const headers = ["Ticket", "Fecha", "Vendedor", "Cliente", "Items", "Pago", "Total"];

  function drawRow(cells: string[], yPos: number, isHeader = false, isFooter = false) {
    let x = startX;
    const rowH = isHeader ? 7 : 6;

    if (isHeader) {
      doc.setFillColor(37, 99, 235);
      doc.setTextColor(255);
      doc.setFontSize(7);
      doc.rect(x, yPos, tableWidth, rowH, "F");
    } else if (isFooter) {
      doc.setFillColor(243, 244, 246);
      doc.setTextColor(17, 24, 39);
      doc.setFontSize(7);
      doc.rect(x, yPos, tableWidth, rowH, "F");
    } else if (yPos % 12 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(x, yPos, tableWidth, rowH, "F");
    }

    if (!isHeader) {
      doc.setTextColor(55, 65, 81);
      doc.setFontSize(6.5);
    }

    cells.forEach((cell, i) => {
      const align = i === 0 || i === 4 || i === 6 ? "right" : "left";
      const textX = align === "right" ? x + colWidths[i] - 2 : x + 1;
      doc.text(cell, textX, yPos + (isHeader ? 4.5 : 4), { align });
      doc.setDrawColor(200);
      doc.line(x + colWidths[i], yPos, x + colWidths[i], yPos + rowH);
      x += colWidths[i];
    });

    doc.setDrawColor(200);
    doc.line(startX, yPos, startX + tableWidth, yPos);
    doc.line(startX, yPos + rowH, startX + tableWidth, yPos + rowH);

    return yPos + rowH;
  }

  // Encabezado
  y = drawRow(headers, y, true);
  const startY = y;

  // Filas de datos
  for (const v of ventas) {
    const row = [
      `#${v.numeroTicket}`,
      v.createdAt.toLocaleDateString("es-PE"),
      v.usuario.nombre,
      v.cliente?.nombre || "-",
      v.detalles.reduce((s, d) => s + d.cantidad, 0).toString(),
      v.metodoPago,
      `S/ ${Number(v.total).toFixed(2)}`,
    ];

    if (y > 270) {
      doc.addPage();
      y = 20;
      y = drawRow(headers, y, true);
    }
    y = drawRow(row, y);
  }

  // Fila de total
  y = drawRow(["", "", "", "", "", "TOTAL:", `S/ ${montoTotal.toFixed(2)}`], y, false, true);

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=reporte-ventas-${new Date().toISOString().split("T")[0]}.pdf`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
import { jsPDF } from "jspdf";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const formato = searchParams.get("formato") || "pdf";

  try {
    const caja = await prisma.caja.findFirst({
      where: { activo: true },
      include: {
        movimientos: {
          orderBy: { createdAt: "desc" },
          take: 200,
          include: { usuario: { select: { nombre: true } } },
        },
      },
    });

    if (!caja) {
      return NextResponse.json({ error: "No hay caja activa" }, { status: 404 });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventasHoy = await prisma.venta.aggregate({
      where: { createdAt: { gte: hoy }, cajaId: caja.id, estado: "COMPLETADA" },
      _sum: { total: true },
      _count: true,
    });

    const movs = caja.movimientos;
    const apertura = movs.find((m) => m.tipo === "APERTURA");
    const totalIngresosExtras = movs
      .filter((m) => m.tipo === "INGRESO")
      .reduce((s, m) => s + Number(m.monto), 0);
    const totalEgresos = movs
      .filter((m) => m.tipo === "EGRESO")
      .reduce((s, m) => s + Number(m.monto), 0);
    const ventasTotal = Number(ventasHoy._sum.total || 0);

    const tipoLabels: Record<string, string> = {
      APERTURA: "Apertura",
      CIERRE: "Cierre",
      INGRESO: "Ingreso Extra",
      EGRESO: "Egreso",
    };

    if (formato === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Reporte de Caja");

      sheet.mergeCells("A1:F1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `Reporte de Caja - ${caja.nombre}`;
      titleCell.font = { bold: true, size: 16 };
      titleCell.alignment = { horizontal: "center" };

      sheet.addRow([]);
      sheet.addRow(["Fecha:", new Date().toLocaleDateString("es-PE")]);
      sheet.addRow(["Caja:", caja.nombre]);
      sheet.addRow([]);

      sheet.addRow(["RESUMEN"]);
      sheet.addRow(["Saldo Actual:", `S/ ${Number(caja.saldoActual).toFixed(2)}`]);
      sheet.addRow(["Apertura:", `S/ ${Number(apertura?.monto || 0).toFixed(2)}`]);
      sheet.addRow(["Ventas del Día:", `S/ ${ventasTotal.toFixed(2)}`]);
      sheet.addRow(["Ingresos Extras:", `S/ ${totalIngresosExtras.toFixed(2)}`]);
      sheet.addRow(["Egresos:", `S/ ${totalEgresos.toFixed(2)}`]);
      sheet.addRow([]);

      const headers = ["Hora", "Tipo", "Monto", "Descripción", "Usuario"];
      const headerRow = sheet.addRow(headers);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };

      for (const m of movs) {
        sheet.addRow([
          m.createdAt.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
          tipoLabels[m.tipo] || m.tipo,
          `S/ ${Number(m.monto).toFixed(2)}`,
          m.descripcion || "-",
          m.usuario.nombre,
        ]);
      }

      const widths = [14, 18, 14, 40, 22];
      sheet.columns.forEach((col: any, i: number) => {
        col.width = widths[i] || 14;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=reporte-caja-${new Date().toISOString().split("T")[0]}.xlsx`,
        },
      });
    }

    // PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text(`Reporte de Caja - ${caja.nombre}`, pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-PE")}`, pageWidth / 2, 28, { align: "center" });

    let y = 36;
    doc.setFontSize(11);
    doc.text("RESUMEN", 10, y); y += 7;

    const lines = [
      ["Saldo Actual:", `S/ ${Number(caja.saldoActual).toFixed(2)}`],
      ["Apertura:", `S/ ${Number(apertura?.monto || 0).toFixed(2)}`],
      ["Ventas del Día:", `S/ ${ventasTotal.toFixed(2)}`],
      ["Ingresos Extras:", `S/ ${totalIngresosExtras.toFixed(2)}`],
      ["Egresos:", `S/ ${totalEgresos.toFixed(2)}`],
    ];

    for (const [label, val] of lines) {
      doc.setFont("helvetica", "normal");
      doc.text(label, 14, y);
      doc.setFont("helvetica", "bold");
      doc.text(val, 80, y);
      y += 6;
    }

    y += 4;

    // Tabla de movimientos
    const colWidths = [18, 22, 18, 50, 28];
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);
    const startX = 10;

    const headers = ["Hora", "Tipo", "Monto", "Descripción", "Usuario"];

    function drawRow(cells: string[], yPos: number, isHeader = false) {
      let x = startX;
      const rowH = isHeader ? 7 : 6;

      if (isHeader) {
        doc.setFillColor(37, 99, 235);
        doc.setTextColor(255);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.rect(x, yPos, tableWidth, rowH, "F");
      } else {
        doc.setTextColor(55, 65, 81);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
      }

      cells.forEach((cell, i) => {
        const align = [0, 1, 3, 4].includes(i) ? "left" : "right";
        const textX = align === "right" ? x + colWidths[i] - 1 : x + 1;
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

    y = drawRow(headers, y, true);

    for (const m of movs) {
      const row = [
        m.createdAt.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        tipoLabels[m.tipo] || m.tipo,
        `S/ ${Number(m.monto).toFixed(2)}`,
        m.descripcion || "-",
        m.usuario.nombre,
      ];

      if (y > 270) {
        doc.addPage();
        y = 20;
        y = drawRow(headers, y, true);
      }
      y = drawRow(row, y);
    }

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=reporte-caja-${new Date().toISOString().split("T")[0]}.pdf`,
      },
    });
  } catch (error) {
    console.error("Error generando reporte de caja:", error);
    return NextResponse.json({ error: "Error al generar reporte" }, { status: 500 });
  }
}

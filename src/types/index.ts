import type { Rol } from "@prisma/client";

export type SidebarItem = {
  label: string;
  href: string;
  icon: string;
  permissions?: string[];
};

export type UserSession = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
};

export type DashboardCard = {
  titulo: string;
  valor: string | number;
  descripcion?: string;
  icono: string;
  color: "blue" | "green" | "yellow" | "red" | "purple";
};

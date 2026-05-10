"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, hasPerm, isAdmin } from "@/lib/auth";

function getHomeRoute(): string {
  if (isAdmin()) return "/dashboard";
  if (hasPerm("reservas_ver")) return "/admin";
  if (hasPerm("mensajes_ver")) return "/mensajes";
  if (hasPerm("mantenimiento_ver")) return "/mantenimiento";
  if (hasPerm("limpieza_ver")) return "/limpieza";
  return "/admin";
}

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
    } else {
      router.replace(getHomeRoute());
    }
  }, [router]);

  return null;
}

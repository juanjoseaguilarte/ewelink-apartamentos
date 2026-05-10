"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getToken } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!getToken()) router.replace("/login");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) { setError(t("change_password.error_match")); return; }
    if (form.next.length < 6) { setError(t("change_password.error_length")); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ current_password: form.current, new_password: form.next }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/admin"), 1500);
      } else {
        setError(data.error ?? t("change_password.error_match"));
      }
    } catch {
      setError(t("login.error_connection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold text-gray-800">{t("change_password.title")}</h1>
          <LanguageSwitcher />
        </div>
        <p className="text-sm text-gray-500 mb-6">{t("change_password.subtitle")}</p>

        {success ? (
          <p className="text-green-600 text-center font-medium">{t("change_password.success")}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("change_password.current")}</label>
              <input
                type="password"
                required
                value={form.current}
                onChange={(e) => setForm({ ...form, current: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("change_password.new")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("change_password.confirm")}</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {loading ? t("change_password.loading") : t("change_password.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

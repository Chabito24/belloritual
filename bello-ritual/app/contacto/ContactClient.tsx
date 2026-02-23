"use client";

import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";

function ContactFormWithSuspense() {
  return <ContactForm />;
}

export default function ContactClient() {
  return (
    <Suspense fallback={<div className="text-sm text-[#5B463D]">Cargando...</div>}>
      <ContactFormWithSuspense />
    </Suspense>
  );
}
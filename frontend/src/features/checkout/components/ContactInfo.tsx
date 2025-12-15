"use client";

import { Input } from "@/components/ui/input";

interface ContactInfoProps {
  name: string;
  email: string;
}

export function ContactInfo({ name, email }: ContactInfoProps) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Contact Information</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
          <Input
            value={name}
            disabled
            className="text-gray-900 disabled:text-gray-700 disabled:opacity-100"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <Input
            value={email}
            disabled
            className="text-gray-900 disabled:text-gray-700 disabled:opacity-100"
          />
        </div>
      </div>
    </div>
  );
}

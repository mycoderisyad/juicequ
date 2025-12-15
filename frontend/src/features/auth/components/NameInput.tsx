"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NameInputProps {
  id?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function NameInput({
  id = "name",
  name = "name",
  value,
  onChange,
  placeholder = "Full Name",
  required = true,
}: NameInputProps) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <User className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <Input
          id={id}
          name={name}
          type="text"
          autoComplete="name"
          required={required}
          placeholder={placeholder}
          className="pl-11"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

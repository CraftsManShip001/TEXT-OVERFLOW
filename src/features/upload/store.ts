"use client";

import { useState } from "react";

export type UploadForm = {
  file?: File;
  nickname: string;
  title: string;
  description: string;
};

export function useUploadForm(initial?: Partial<UploadForm>) {
  const [form, setForm] = useState<UploadForm>({
    file: undefined,
    nickname: "",
    title: "",
    description: "",
    ...initial,
  });

  return {
    form,
    set<K extends keyof UploadForm>(key: K, value: UploadForm[K]) {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    reset() {
      setForm({ file: undefined, nickname: "", title: "", description: "" });
    },
  };
}



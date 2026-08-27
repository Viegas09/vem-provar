import { useState } from "react";

export function useShare() {
  const [copied, setCopied] = useState(false);

  async function share({ title, text, url }) {
    const shareUrl = url || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
      } catch {
        // usuário cancelou o compartilhamento — tudo bem, não faz nada
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponível nesse navegador — nada mais a fazer
    }
  }

  return { copied, share };
}

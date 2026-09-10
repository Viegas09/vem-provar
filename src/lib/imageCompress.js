const MAX_DIM = 1280;
const QUALITY = 0.82;

// foto direto da câmera do celular costuma vir com vários MB — sem isso, o
// parceiro espera um upload lento numa conexão ruim, e todo cliente que abre
// o cardápio baixa essa mesma imagem gigante depois. Reduz o lado maior pra
// no máximo MAX_DIM px e reexporta em JPEG; nunca aumenta uma imagem pequena.
export async function compressImage(file, { maxDim = MAX_DIM, quality = QUALITY } = {}) {
  if (!file || !file.type?.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    // navegador sem suporte ou falha qualquer — sobe o arquivo original em vez de travar o parceiro
    return file;
  }
}

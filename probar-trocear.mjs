import { readFile, readdir } from "node:fs/promises";
import { trocear, trocearPorMarca } from "./trocear.mjs";
import { MARCA } from "./marca.mjs";

for (const archivo of (await readdir("corpus")).filter(a => /\.(txt|md)$/i.test(a))) {
  const texto = await readFile(`corpus/${archivo}`, "utf8");
  const fragmentos = MARCA ? trocearPorMarca(texto, MARCA) : trocear(texto, 1000, 150);
  const largos = fragmentos.map(f => f.texto.length);
  const conSeccion = fragmentos.filter(f => f.seccion).length;

  console.log(`\n${archivo}: ${texto.length} caracteres -> ${fragmentos.length} fragmentos`);
  console.log(`  con sección reconocida: ${conSeccion} de ${fragmentos.length}`);
  console.log(`  el más corto: ${Math.min(...largos)} caracteres · el más largo: ${Math.max(...largos)}`);
  for (const f of fragmentos.slice(0, 4)) {
    console.log(`  #${f.id}  [${f.seccion ?? "sin sección"}]  «${f.texto.slice(0, 50).replace(/\s+/g, " ")}…»`);
  }
}

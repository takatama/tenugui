const PRODUCT_CONTEXT =
  /(?:^|[\s【】/：:])(?:手ぬぐい|てぬぐい|注染|捺染|かまわぬ|濱文様|にじゆら|kenema|楽天市場)(?=$|[\s「『】（(/])/iu;
const GENERIC_QUOTE =
  /^(?:手ぬぐい|てぬぐい|注染|捺染|日本製|送料無料|メール便|かまわぬ|濱文様|にじゆら|kenema|綿100[%％]?)$/iu;
const SHOP_LABEL =
  /^(?:楽天市場|送料無料|送料込み|メール便.*|ネコポス.*|手ぬぐい|てぬぐい|注染|捺染|日本製|かまわぬ|濱文様|にじゆら|kenema)$/iu;

/** A display title only. The saved name and product information stay intact. */
export function getDisplayName(name: string): string {
  const trimmed = name.trim();
  // Recognizable product-page structures; a free-form personal title does not
  // match these separators and shop suffixes.
  const catalogTitle = trimmed.match(
    /^(.+?)\s*[｜|]\s*(?:手ぬぐい|てぬぐい)\s*[｜|]/u,
  )?.[1];
  if (catalogTitle?.trim()) return catalogTitle.trim();
  const textileTitle = trimmed.match(
    /^伊勢木綿\s+textile手ぬぐい[／/]\s*(.+?)\s+-\s+SOU・SOU\s+netshop/iu,
  )?.[1];
  if (textileTitle?.trim()) return textileTitle.trim();
  const bracketTitle = trimmed.match(
    /^【([^】]+)】(?=【(?:捺染|注染|濱文様|にじゆら)】)/u,
  )?.[1];
  if (bracketTitle?.trim()) return bracketTitle.trim();
  const quotes = [...trimmed.matchAll(/[「『]([^」』]+)[」』]/gu)];
  const standaloneQuote = /^[「『][^」』]+[」』]$/u.test(trimmed);
  if (standaloneQuote || PRODUCT_CONTEXT.test(trimmed)) {
    const title = quotes
      .find((quote) => {
        const candidate = quote[1].trim();
        return candidate.length > 0 && !GENERIC_QUOTE.test(candidate);
      })?.[1]
      .trim();
    if (title) return title;
    if (quotes.length) return name;
  }

  // Strip only recognized shop labels and explicit product prefixes. A personal
  // name, an unknown bracket label, and an unrecognized title remain unchanged.
  let title = trimmed;
  let changed = false;
  while (true) {
    const label = title.match(/^【([^】]+)】\s*/u);
    if (!label || !SHOP_LABEL.test(label[1].trim())) break;
    title = title.slice(label[0].length);
    changed = true;
  }
  const prefix =
    /^(?:手ぬぐい|てぬぐい|注染|捺染|かまわぬ|濱文様|にじゆら|kenema)\s+/iu;
  while (prefix.test(title)) {
    title = title.replace(prefix, "");
    changed = true;
  }
  if (changed)
    title = title.replace(/\s*\|\s*SCOPE\s*(?:\(スコープ\))?\s*$/iu, "");
  return changed && title.trim() ? title.trim() : name;
}
